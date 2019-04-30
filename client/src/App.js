import React from 'react';
import logo from './logo.svg';
import './App.css';
import Axios from './axios';

class App extends React.Component {
  state = {
      page: "",
      e: ""
  };

  async componentDidMount() {
      try{
          const page = await Axios.get('http://localhost:5000');
          console.log(page.data);
          this.setState({
              page: page.data.toString()
          })
      } catch (e) {

      }
  }

  render() {
    return (
      <div className="App">
          {this.state.page}
          {this.state.e}
      </div>
    );
  }
}

export default App;
