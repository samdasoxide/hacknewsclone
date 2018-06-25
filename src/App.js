import React, { Component } from 'react';
import { ArrowUp, ArrowDown } from 'react-feather';
import axios from 'axios';
import { sortBy } from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './App.css';

const DEFAULT_QUERY = 'redux';
const DEFAUTLT_HPP = '100';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const largeColumn = {
  width: '35%',
};

const midColumn = {
  width: '25%',
};

const smallColumn = {
  width: '10%',
};

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse(),
}

const Button = ({className, onClick, children}) =>
  <button
  className={className}
  onClick={onClick}
  type="submit">
    {children}
  </button>

Button.propTypes = {
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Button.defaultProps = {
  className: '',
};


class Search extends Component {
  componentDidMount() {
    if(this.input) {
      this.input.focus();
    }
  }

  render() {
    const {value, onChange, onSubmit, children} = this.props;
    return(
      <form onSubmit={onSubmit}>
        <input type="text"
        value={value}
        onChange={onChange}
        ref={(node) => {this.input = node;}}
        />
        <Button>
        {children}
        </Button>
      </form>
    );
  }
}

Search.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  children: PropTypes.node,
};


const Table = ({list, onDismiss, sortKey, onSort, isSortReverse }) =>
  {
  const sortedList = SORTS[sortKey](list);
  const reverseSortedList = isSortReverse
    ? sortedList.reverse()
    : sortedList;
  return(
    <div className='table'>
      <div className="table-header">
        <span style={{ width: '40%' }}>
          <Sort
            sortKey={'TITLE'}
            onSort={onSort}
            activeSortKey={sortKey}
            isSortReverse={isSortReverse}>
            Title
          </Sort>
        </span>
        <span style={{ width: '10%' }}>
          <Sort
            sortKey={'AUTHOR'}
            onSort={onSort}
            activeSortKey={sortKey}
            isSortReverse={isSortReverse}>
            author
          </Sort>
        </span>
        <span style={{ width: '10%' }}>
          <Sort
            sortKey={'COMMENTS'}
            onSort={onSort}
            activeSortKey={sortKey}
            isSortReverse={isSortReverse}>
            Comments
          </Sort>
        </span>
        <span style={{ width: '10%' }}>
          <Sort
            sortKey={'POINTS'}
            onSort={onSort}
            activeSortKey={sortKey}
            isSortReverse={isSortReverse}>
            Points
          </Sort>
        </span>
        <span style={{ width: '10% '}}>
          Archive
        </span>
      </div>
      {reverseSortedList.map(item =>
        <div key={item.objectID} className="table-row">
          <span style={largeColumn}>
               <a href={item.url}>{item.title}</a>
           </span>
           <span style={midColumn}>{item.author}</span>
           <span style={smallColumn}>{item.num_comments}</span>
           <span style={smallColumn}>{item.points}</span>
           <span style={smallColumn}>
              <Button
               onClick={() => onDismiss(item.objectID)}
              >
                Dismiss
              </Button>
           </span>
        </div>
      )}
    </div>
  );
}


Table.propTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number,
    })
    ).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

const Sort = ({ sortKey, onSort, children, activeSortKey, isSortReverse }) => {
  const sortClass = classNames(
    'button-inline',
    {'button-active': sortKey === activeSortKey}
  );

  return(
    <div>
      <Button
        onClick={() => onSort(sortKey)}
        className={sortClass}>
        {children}
      </Button>
      {sortKey === activeSortKey? (isSortReverse? <ArrowDown/> : <ArrowUp/>): ''}
    </div>
  );
}

const Loading = () =>
  <div>Loading...</div>

const withLoading = (Component) => ({ isLoading, ...rest }) =>
  isLoading
  ? <Loading />
  : <Component {...rest} />

const ButtonWithLoading = withLoading(Button);

class App extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);

    this.state = {
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      error: null,
      isLoading: false,
      sortKey: 'NONE',
      isSortReverse: false,
    };

    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSubmitSearch = this.onSubmitSearch.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.onSort = this.onSort.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    const { searchTerm } = this.state;
    this.setState({searchKey: searchTerm});
    this.fetchSearchTopStories(searchTerm);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  fetchSearchTopStories(searchTerm, page=0) {
    this.setState({ isLoading: true });
    axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAUTLT_HPP}`)
      .then(result => this._isMounted && this.setSearchTopStories(result.data))
      .catch(error => this._isMounted && this.setState({ error}));
  }

  setSearchTopStories(result) {
    const {hits, page} = result;
    const {searchKey, results } = this.state;

    const oldHits = results && results[searchKey]? results[searchKey].hits : [];

    const updateHits = [...oldHits, ...hits]

    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updateHits, page }
      },
      isLoading: false,
    });
  }

  onSearchChange(event) {
    this.setState({searchTerm: event.target.value });
    console.log(this.state.searchTerm);
  }

  needsToSearchTopStories(searchTerm){
    return !this.state.results[searchTerm];
  }

  onSubmitSearch(event) {
    const {searchTerm} = this.state;
    this.setState({searchKey: searchTerm});
    event.preventDefault();
    if(this.needsToSearchTopStories(searchTerm)){
      this.fetchSearchTopStories(searchTerm);
    }
  }

  onDismiss(id) {
    const {searchKey, results } = this.state;
    const {hits, page } = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    this.setState({
      results: {results, [searchKey]:{hits: updatedHits, page }}
    });
  }

  onSort(sortKey) {
    const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
    this.setState({ sortKey, isSortReverse });
  }

  render() {
    const { results, searchKey, searchTerm, error, isLoading, sortKey, isSortReverse } = this.state;

    const page = (
      results &&
      results[searchKey] &&
      results[searchKey].page
    ) || 0;

    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits
    ) || [];

    return (
      <div className="page">
        <div className="interactions">
          <Search
          value={searchTerm}
          onChange={this.onSearchChange}
          onSubmit={this.onSubmitSearch}
          >
           Search
          </Search>
        </div>
        {error
          ? <div className="interactions">
              <p>Something went wrong.</p>
            </div>
          : <Table
            list={list}
            sortKey={sortKey}
            isSortReverse={isSortReverse}
            onSort={this.onSort}
            onDismiss={this.onDismiss}
            />
        }
        <div className="interactions">
          <ButtonWithLoading
          isLoading={isLoading}
          onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
            More
          </ButtonWithLoading>
        </div>
      </div>
    );
  }
}

export default App;

export {
  Button,
  Table,
  Search
};
