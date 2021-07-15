import React from 'react';

const ThemeContext = React.createContext({
  color: 'red',
  background: '#000',
});

class ThemeProvider extends React.Component {
    state = {
      theme: {
        color:'green', 
        background: '#ccc',
      }
    }
   switchTheme = (theme) => {
      this.setState({theme});
    }
   render() {
     console.log('render ThemeProvider');
     const {theme} = this.state;
     return (
     <ThemeContext.Provider value={{theme, switchTheme: this.switchTheme}}>
         {this.props.children}
      </ThemeContext.Provider>
     )
   }
}
class App extends React.Component {
  render() {
    console.log('render app')
    return (
      <ThemeProvider>
        <Header></Header>
        <Content>内容</Content>
       </ThemeProvider>
    );
  }
}

class Header extends React.Component {
  render(){
    console.log('render header')
    return (<h1>不会重复渲染</h1>)
  }
}

const theme1 = {
  color: 'pink',
  background: '#000',
};
const theme2 = {
  color: '#fff',
  background: '#000',
};
class Content extends React.Component {
  render(){
    console.log('render content')
    return (
      <ThemeContext.Consumer>
        {
          context => {
            const {theme, switchTheme} = context;
            console.log('content change')
            return [
              <h2 style={theme}>{this.props.children}</h2>,
              <button key='1' onClick={() => switchTheme(theme1)}>theme1</button>,
              <button key='2' onClick={() => switchTheme(theme2)}>theme2</button>
            ]
          }
        }
      </ThemeContext.Consumer>
    )
  }
}


export default App;