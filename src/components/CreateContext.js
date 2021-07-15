import React, { createContext, Component } from 'react';
import PropTypes from 'prop-types';


// 旧的 Context api
class Button extends Component {
	static contextTypes = {
		color: PropTypes.string
	};
	render () {
		return (<button style={{background: this.context.color}}>{this.props.children}</button>)
	}
}

// Button.contextTypes = {
// 	color: PropTypes.string
// };



class Message extends React.Component {
  render() {
    return (
      <div>
        {this.props.text} <Button>Delete</Button>
      </div>
    );
  }
}

class MessageList extends React.Component {
	static childContextTypes = {
		color: PropTypes.string
	};
  getChildContext() {
    return {color: "purple"};
  }

  render() {
		
    return <div>我是被渲染的标题</div>;
  }
}

// MessageList.childContextTypes = {
//   color: PropTypes.string
// };








// 新的api
// 创建默认的主题
const ThemeContext = createContext({
	color: '#000'
});


class CreateContextDemo extends React.Component {

	state = {
		color: '#000'
	}
	switchTheme = (color) => {
		console.log(color)
		this.setState({
			color
		});
	}

	render() {

		return (
			// 在Provider 组件中传递一个value来修改默认的值， 如果这个vlaue的值发生变化
			<ThemeContext.Provider value={{color: this.state.color, switchTheme: this.switchTheme}}>
				<Header />
				<Title>我是Title中的内容</Title>
			</ThemeContext.Provider>
		)
	}
}


class Header extends React.Component {
	render() {
		console.log('我是Header组件')
		return(
			<h2>标题</h2>
		)
	}
}


class Title extends React.Component {
	render() {
		return (
			<ThemeContext.Consumer>
				{
					({color, switchTheme}) => <div>
						<h1 style={{color}}>{this.props.children}</h1>
						<button onClick={() => switchTheme('red')}>Red Theme</button>
      			<button onClick={() => switchTheme('green')}>Green Theme</button>
					</div>
				}
			</ThemeContext.Consumer>


			// 使用class.contextType
			// <h1 style={this.context}>{this.props.children}</h1>
		);
	}
}

// 另一种使用Class.contextType的方式
// 将 创建的Context对象挂载到 class 组件的contextType上，此时在这个class组将中可以通过this.context来访问创建的Context内容
// Title.contextType = ThemeContext;

const {data:{template: {edittemplateContent = {}}}} = this.props

export default CreateContextDemo;
// export default MessageList;