import React, { Component } from 'react';
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

const Button = ({className='', onClick, children}) =>
  <button
  className={className}
  onClick={onClick}
  type="submit">
    {children}
  </button>


const Search = ({value, onChange, onSubmit, children}) =>
  <form onSubmit={onSubmit}>
    <input type="text"
    value={value}
    onChange={onChange}
    />
    <button
    type='submit'
    >
    {children}
    </button>
  </form>


const Table = ({list, pattern, onDismiss}) =>
  <div>
    {list.map(item =>
        <div key={item.objectID} className='table-row'>
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
        )
    }
  </div>


class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
    };

    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSubmitSearch = this.onSubmitSearch.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
  }

  componentDidMount() {
    const { searchTerm } = this.state;
    this.setState({searchKey: searchTerm});
    this.fetchSearchTopStories(searchTerm);
  }

  fetchSearchTopStories(searchTerm, page=0){
    fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAUTLT_HPP}`)
      .then(response => response.json())
      .then(result => this.setSearchTopStories(result))
      .catch(error => error);
  }

  setSearchTopStories(result){
    const {hits, page} = result;
    const {searchKey, results } = this.state;

    const oldHits = results && results[searchKey]? results[searchKey].hits : [];

    const updateHits = [...oldHits, ...hits]

    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updateHits, page }
      }
    });
  }

  onSearchChange(event){
    this.setState({searchTerm: event.target.value });
    console.log(this.state.searchTerm);
  }

  needsToSearchTopStories(searchTerm){
    return !this.state.results[searchTerm];
  }

  onSubmitSearch(event){
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

  render() {
    const {results, searchKey, searchTerm} = this.state;

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
        <Table
        list={list}
        onDismiss={this.onDismiss}
        />
        <div className="interactions">
          <Button onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
            More
          </Button>
        </div>
      </div>
    );
  }
}

export default App;
