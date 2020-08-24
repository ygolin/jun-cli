import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import HelloWorld from './components/HelloWorld'
class App extends Component {
    state = {
        title: "React"
    }
    render() {
        const { title } = this.state
        return <div>
            <h1 style={{textAlign:'center',marginBottom:'150px',marginTop:'50px'}}> Hello { title }! </h1>
            <HelloWorld />
        </div>
    }
}
ReactDOM.render(<App/>, document.getElementById('app'))