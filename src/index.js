// import React from 'react';
// import ReactDOM from 'react-dom';
// import './index.css';
// import App from './App';
import * as serviceWorker from './serviceWorker';
import RReact from './RReact';

// ReactDOM.render(<App />, document.getElementById('root'));
// ReactDOM.unstable_createRoot(
//   document.getElementById('root')
// ).render(<App />);

// // If you want your app to work offline and load faster, you can change
// // unregister() to register() below. Note this comes with some pitfalls.
// // Learn more about service workers: https://bit.ly/CRA-PWA


// const element = {
//   type: 'h1',
//   props: {
//     title: '哈哈哈哈',
//     children: 'Own React'
//   }
// }


// const node = document.createElement(element.type)
// node['title'] = element.props.title;
// const text = document.createTextNode('');
// text['nodeValue'] = element.props.children;
// node.appendChild(text)
// const container = document.getElementById('root');
// // container.appendChild(node)


// /** @jsx RReact.createElement */
// const element = (
//   <div id="foo">
//     <a>bar</a>
//     <b />
//   </div>
// )

// RReact.render(element, container)
// console.log(element)



/** @jsx RReact.createElement */
function App(props) {

  const [count, setCount] = RReact.useState(1)

  return <h1 style={{cursor: 'pointer'}} onClick={() => {console.log(1323); setCount(count + 1)}}>
    Count: {count}
  </h1>
}
const element = <App name="foo" />
const container = document.getElementById("root")
RReact.render(element, container)

serviceWorker.unregister();






