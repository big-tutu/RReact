## OWN_REACT
#### Step1, RReact.render、RReact.createElement

目标：将dom转为jsx对象，并且使用render进行渲染元素到页面上, 绑定属性，文本内容

```js
// 常量
const TEXT_ELEMENT = 'TEXT_ELEMENT' // 标识文本类型


	/**
 * 渲染方法
 * @param {*} element 
 * @param {*} container 
 */
function render (element, container) {
	// 创建节点，区分是否为文本节点
	const dom = element.type === TEXT_ELEMENT ? document.createTextNode('') : document.createElement(element.type)

	// 插入所有所属，排除children属性 其中，文本是使用nodeValue
	const isProperty = key => key !== 'children'
	Object.keys(element.props).filter(isProperty).forEach(name => dom[name] = element.props[name])

	element.props.children.forEach(child => {
		render(child, dom)
	});

	container.appendChild(dom)
}
	// createElement方法
	/**
 * 创建文本对象
 * @param {*} text 
 * @returns 
 */
function createTextElement (text) {
	return {
		type: TEXT_ELEMENT,
		props: {
			nodeValue: text, // 存储纯文本
			children: []
		}
	}
}


/**
 * 创建react对象
 * @param {*} type 
 * @param {*} props 
 * @param  {...any} children 
 * @returns 
 */
function createElement (type, props, ...children) {
	const element = {
		type,
		props: {
			...props,
			// The children array could also contain primitive values like strings or numbers
			children: children.map(child => typeof child === 'object' ? child : createTextElement(child)),
		}
	}

	return element
}


const Didact = {
  createElement,
  render,
}
​
/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
const container = document.getElementById("root")
Didact.render(element, container)


```



#### Step2, 可中断的任务调度
为什么重构：是应为render方法中是递归调用，一旦开始无法中断，如果app tree过大，导致主线程被一直占用，造成渲染不及时，页面出现卡顿，这就是react15的一个缩影。   
重构成什么样：可中断的渲染更新

```js
let nextUnitOfWork = null

function workLoop (deadline) {
	let shouldYield = false;
	while (nextUnitOfWork && !shouldYield) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
		shouldYield = deadline.timeRemaining() < 1
	}

	// 在浏览器的每一帧中，如果主线程为空时浏览器会执行该方法， 这与react中能的Scheduler在概念上是相近的， requestIdleCallback方法的   
	// 回调函数会接收到一个剩余时间的参数 deadline
	requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork (nextUnitOfWork) {
	// todo
}
```

#### Step3, Fiber结构 及 performUnitOfWork 实现
确定Fiber的结构来生产整个fiber tree, fiber tree 中的每一个fiber节点就是一个工作单元，    
下面来完成一个栗子：
```js
Didact.render(
  <div>
    <h1>
      <p />
      <a />
    </h1>
    <h2 />
  </div>,
  container
)
```
需要做三件事：      
1. 将根节点插入dom      
2. 为每一个元素节点穿件fiber     
3. 确定下一个工作单元 即 performUnitOfWork 的返回值     
开始code, 首先重构render方法，将穿件元素的逻辑抽出来作为一个单独的函数，并将每个节点名称换位fiber, 

```js
	// 抽取 createDom
	function createDom (fiber) {
	// 创建节点，区分是否为文本节点
	const dom = fiber.type === TEXT_ELEMENT ? document.createTextNode('') : document.createElement(fiber.type)

	// 判断是否是children属性
	const isProperty = key => key !== 'children'
	// 插入所有所属， 其中，文本是使用nodeValue
	Object.keys(fiber.props).filter(isProperty).forEach(name => dom[name] = fiber.props[name])

	// 移除递归的代码
	// fiber.props.children.forEach(child => {
	// 	render(child, dom)
	// });
}
```

```js
// performUnitOfWork
function performUnitOfWork (fiber) {
	// TODO add dom node
  // TODO create new fibers
  // TODO return next unit of work

	if (!fiber.dom) {
		// 真实的 dom 节点存储在fiber.dom上
		fiber.dom = createDom(fiber)
	}

	if (fiber.parent) {
		// 将单签节点追加到父节点的dom结构中
		fiber.parent.dom.appendChild(fiber.dom)
	}

	// 为每一个子节点创建fiber
	let index = 0;
	let prevSibling = null;  // 前一个兄弟
	const elements = fiber.props.children

	while (index < elements.length) {
		const element = elements[index]
		const newFiber = {
			type: element.type,
			props: element.props,
			parent: fiber,
			dom: null,
		}
	// 新建的fiber节点在加入到fiber tree中时，是作为子节点还是兄弟节点插入取决于他是否是第一个节点
		if (index === 0) {
			fiber.child = newFiber
		} else {

			prevSibling.sibling = newFiber;
		}

		// 将新的fiber作为前一个fiber
		prevSibling = newFiber;
		index++
	}




	/**
	 * 寻找下一个需要工作单元, 
	 * 1、返回直接点
	 * 2、返回兄弟节点
	 * 3、返回父节点的兄弟节点
	 * 4、一直返回上一级的兄弟节点知道回到根节点
	 */

	if (fiber.child) {
		return fiber.child
	}
	let nextUnitFiber = fiber
	while (nextUnitFiber) {
		if (nextUnitFiber.sibling) {
			return nextUnitFiber.sibling
		}
		nextUnitFiber = nextUnitFiber.parent
	}
}

```

#### Step4 Render and Commit
思考一个问题：我们每次渲染一个节点，就会将整个节点插入到DOM中，但是还未完成整个树的渲染前可能会被浏览器打断，这回造成页面渲染不完全     
解决方式：在render方法中保存本次工作中的root节点，在这里命名为workInProgressRoot
```js
	// ...
	let workInProgressRoot = null // 缓存本此更新的root
	function render () {
		workInProgressRoot = {
			dom: container,
			props: {
				children: [element]
			}
		}

		nextUnitOfWork = workInProgressRoot
	}
```

提交操作
```js
	/**
 * commit阶段是一个同步的过程，在真实的React源码中也是一个同步任务
 * 前序遍历，递归操作
 * @param {*} fiber 
 */
function commitWork (fiber) {
	if (!fiber) return
	const domParent = fiber.parent.dom
	domParent.appendChild(fiber.dom)
	commitWork(fiber.children)
	commitWork(fiber.sibling)
}


/**
 * 将整个DOM树替换熬页面上
 */
function commitRoot () {
	// 提交渲染
	commitWork(workInProgressRoot.child)

	// 重置
	workInProgressRoot = null
}

```

#### Step5 Reconciliation

Reconciliation 对比新旧dom节点的的差异，决定更新的内容，俗称diff, 将已经被commit完成的fiber树保存为currentRoot, 并且新增alternate属性用于保存每一个    
fiber对应的前一次渲染的fiber，接下来需要对performUnitOfWork进行改造，新建一个 reconcileChildren 方法 用于处理fiber。    
因此我们需要对比新旧fiber节点来决定更新额内容，下面是一个对比依据：
* 如果新旧的节点有这同样的类型type, 沿用这个dom节点，只更新props
* 如果type不同，以为这要穿件新的dom节点
* 如果两者type不同，而且存在旧的fiber节点，需要移除这个节点

```js


/**
 * 处理每一个fiber， 在performUnitOfWork中调用
 * @param {*} wipFiber 
 * @param {*} elements 
 */
function reconcileChildren (wipFiber, elements) {
	// 为每一个子节点创建fiber
	let index = 0

	// 对应的前一次提交的fiber
	let oldFiber = wipFiber.alternate && wipFiber.alternate.child

	let prevSibling = null  // 前一个兄弟

	while (
		index < elements.length ||
		oldFiber != null
	) {
		const element = elements[index]
		let newFiber = null

		// 判断新旧节点是否是同一类型的节点
		const isSameType = element && oldFiber && oldFiber.type === oldFiber.type



		if (isSameType) {
			// todo update
			// 保留odlFiber的dmo属性，只需要更新elements的props 并增加一个更新标识effectTag
			newFiber = {
				type: oldFiber.type,
				props: element.props, // 更新props
				parent: wipFiber,
				dom: oldFiber.dom,
				alternate: oldFiber,
				effectTag: UPDATE
			}
		}

		if (element && !isSameType) {
			// todo add
			newFiber = {
				type: element.type,
				props: element.props, // 更新props
				parent: wipFiber,
				dom: null,
				alternate: null,
				effectTag: PLACEMENT
			}
		}

		if (oldFiber && !isSameType) {
			// todo delete
			oldFiber.effectTag = DELETION
			deletions.push(oldFiber)
		}

		// 旧节点的兄弟节点
		if (oldFiber) {
			oldFiber = oldFiber.sibling
		}

		// // 新建的fiber节点在加入到fiber tree中时，是作为子节点还是兄弟节点插入取决于他是否是第一个节点
		if (index === 0) {
			wipFiber.child = newFiber
		} else {

			prevSibling.sibling = newFiber
		}

		// 将新的fiber作为前一个fiber
		prevSibling = newFiber
		index++
	}
}

```

更新 commitWork
```js
/**
 * commit阶段是一个同步的过程，在真实的React源码中也是一个同步任务
 * 前序遍历，递归操作
 * @param {*} fiber 
 */
function commitWork (fiber) {
	if (!fiber) return
	const domParent = fiber.parent.dom
	if (fiber.effectTag === PLACEMENT && fiber.dom) {
		domParent.appendChild(fiber.dom)
	} else if (fiber.effectTag === UPDATE && fiber.dom) {
		updateDom(fiber.dom, fiber.alternate.props, fiber.props)
	} else if (fiber.effectTag === DELETION) {
		domParent.removeChild(fiber.dom)
	}
	commitWork(fiber.child)
	commitWork(fiber.sibling)
}
```

然后在updateDom方法中更新和删除属性，并对事件进行处理

```js

/**
 * 更新fiber 更新
 * @param {*} dom 
 * @param {*} prevProps 
 * @param {*} nextProps 
 */
function updateDom (dom, prevProps, nextProps) {

		// 移除旧的或者是更新的事件
	Object.keys(prevProps)
		.filter(isEvent) 
		.filter(key => !(key in nextProps) || isNewProperty(prevProps, nextProps)(key))
		.forEach(name => {
			const eventType = name.toLowerCase().substring(2)
			dom.removeEventListener(eventType, prevProps[name])
		})

	// 监听新的事件
	Object.keys(nextProps)
		.filter(isEvent)
		.filter(isNewProperty(prevProps, nextProps))
		.forEach(name => {
			const eventType = name.toLowerCase().substring(2)
			dom.addEventListener(eventType, nextProps[name])
		})


	// 将移除的属性置空
	Object.keys(prevProps)
		.filter(isProperty)
		.filter(isGoneProperty(prevProps, nextProps))
		.forEach(name => {
			// 将新的dom
			dom[name] = ''
		})

	// 新增或者更新的属性
	Object.keys(nextProps)
		.filter(isProperty)
		.filter(isNewProperty(prevProps, nextProps))
		.forEach(name => {
			dom[name] = nextProps[name]
		})
}
```


#### Step6 函数组件

修改demo
```jsx
/** @jsx Didact.createElement */
function App(props) {
  return <h1>Hi {props.name}</h1>
}
const element = <App name="foo" />
const container = document.getElementById("root")
Didact.render(element, container)

```
转为jsx后
```jsx
function App(props) {
  return Didact.createElement(
    "h1",
    null,
    "Hi ",
    props.name
  )
}
const element = Didact.createElement(App, {
  name: "foo",
})
```

函数组件的特点：
+ 没有真实的dmo节点 
+ 子节点通过执行函数返回，而不是在props中获取

调整performUnitOfWork方法
```jsx
/**
 * 开始工作
 * 核心方法，处理当前工作中的fiber节点，返回下一个要执行的fiber节点，
 * @param {*} fiber 
 * @returns 
 */
function performUnitOfWork (fiber) {
	// TODO add dom node
  // TODO create new fibers
  // TODO return next unit of work

	// if (!fiber.dom) {
	// 	// 真实的 dom 节点存储在fiber.dom上
	// 	fiber.dom = createDom(fiber)
	// }
	// if (fiber.parent) {
	// 	// 将当前节点追加到父节点的dom结构中
	// 	fiber.parent.dom.appendChild(fiber.dom)
	// }
	//  const elements = fiber.props.children

	// reconcileChildren(fiber, elements)


	const isFunctionComponent = fiber.type instanceof Function
	if (isFunctionComponent) {
		updateFunctionComponent(fiber)
	} else {
		updateHostComponent(fiber)
	}

	if (fiber.child) {
		return fiber.child
	}
	let nextUnitFiber = fiber
	while (nextUnitFiber) {
		if (nextUnitFiber.sibling) {
			return nextUnitFiber.sibling
		}
		nextUnitFiber = nextUnitFiber.parent
	}
}

```
新增组件处理的方法
```jsx
/**
 * 函数组件，执行函数方法返回子组件
 * @param {*} fiber 
 */
function updateFunctionComponent (fiber) {
	// 执行函数组件将props传递个组件
	const children = [fiber.type(fiber.props)]
	reconcileChildren(fiber, children)
}

function updateHostComponent (fiber) {
	if (!fiber.dom) {
		fiber.dom = createDom(fiber)
	}
	reconcileChildren(fiber, fiber.props.children)
}
```


在commit时，我们知道函数组件没有真实对应的dom节点，因此我们需要向上查找一个真实的dom节点
```jsx
	function commitWork (fiber) {
	// ...

	// const domParent = fiber.parent.dom
	let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom
	// ...
}
```




#### Step7 Hooks

* useState
```jsx
	/**
 * 
 * 1、当调用useState时，如果不是在组件内第一次调用，则需要拿到前一次调用后存储的值, 
 * 2、构建新的hook并保存到当前fiber的hooks中
 * @param {*} initValue 
 * @returns 一个新的值已经设置值的action
 */
function useState (initValue) {

	// 读取前次渲染保留的state
	const oldHook = 
	workInProgressFiber.alternate && 
	workInProgressFiber.alternate.hooks && 
	workInProgressFiber.alternate.hooks[hookIndex]

	const hook = {
		state: oldHook ? oldHook.state : initValue,
		queue: []
	}


	// 获取前一次useState被调用是保存的action
	const actions = oldHook ? oldHook.queue : []
	actions.forEach(action => {
		hook.state = action(hook.state)
	})

	workInProgressFiber.hooks.push(hook)

	const setState = (newValue) => {
		const action = (oldValue) => oldValue + newValue
		hook.queue.push(action)

		// 为 workInProgressRoot 和 nextUnitOfWork 赋值，preformOfUnitWork
		workInProgressRoot = {
			dom: currentRoot.dom,
			props: currentRoot.props,
			alternate: currentRoot
		}

		nextUnitOfWork = workInProgressRoot
		deletions = []
	}
	hookIndex++

	return [hook.state, setState]
}
```
