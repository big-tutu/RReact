

// 节点类型
const TEXT_ELEMENT = 'TEXT_ELEMENT'


// 更新类型
const UPDATE = 'UPDATE'
const PLACEMENT = 'PLACEMENT'
const DELETION = 'DELETION'

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


// 当前正在工作中的fiber节点
let workInProgressFiber = null

// 当前fiber节点执行到的第几个hook
let hookIndex = null 

// 下一个工作fiber单元
let nextUnitOfWork = null

// 本次渲染中的根节点
let workInProgressRoot = null

// 当前渲染在页面上的dom节点对应的fiber树，也就是前一次commit的fiber树
let currentRoot = null

// 记录需要被删除的old fiber 节点
let deletions = null

// 是否是事件
const isEvent = key => key.startsWith("on")

// 判断是否是children属性
const isProperty = key => key !== 'children' && !isEvent(key)

// 判断是否为新的属性
const isNewProperty = (prev, next) => key => prev[key] !== next[key]

// 被删除的属性，
const isGoneProperty = (prev, next) => key => !(key in next)

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


	// 移除删除的属性
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

/**
 * 创建dom节点
 * @param {*} fiber 
 */
function createDom (fiber) {
	// 创建节点，区分是否为文本节点
	const dom = fiber.type === TEXT_ELEMENT ? document.createTextNode('') : document.createElement(fiber.type)

	// 插入所有所属， 其中，文本是使用nodeValue
	updateDom(dom, {}, fiber.props)

	return dom
}




/**
 * 删除节点，在删除节点是我们需要确保找到真实的dom节点进行移除
 * @param {*} fiber 
 * @param {*} parent 
 */
function commitDeletion (fiber, parent) {
	if (fiber.dom) {
		parent.removeChild(fiber.dom)
	} else {
		commitDeletion(fiber.child, parent)
	}
}



/**
 * commit阶段是一个同步的过程，在真实的React源码中也是一个同步任务
 * 前序遍历，递归操作
 * @param {*} fiber 
 */
function commitWork (fiber) {
	if (!fiber) return

	// 函数组件没有真实dom节点 因此向上找到真实的dom节点
	// const domParent = fiber.parent.dom
	let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom


	if (fiber.effectTag === PLACEMENT && fiber.dom) {
		domParent.appendChild(fiber.dom)
	} else if (fiber.effectTag === UPDATE && fiber.dom) {
		updateDom(fiber.dom, fiber.alternate.props, fiber.props)
	} else if (fiber.effectTag === DELETION) {
		// 在处理删除时，也需要找到真实的dom节点才能进行删除
		commitDeletion(fiber, domParent)
	}
	commitWork(fiber.child)
	commitWork(fiber.sibling)
}


/**
 * 将整个DOM树替换熬页面上
 */
function commitRoot () {

	// 开始之前仙女处理要删除的节点
	deletions.forEach(commitWork)

	// 提交渲染
	commitWork(workInProgressRoot.child)

	// 重置
	currentRoot = workInProgressRoot
	workInProgressRoot = null
}

/**
 * workLoop 会在也买开始后浏览器剩余的时间调用
 * @param {*} deadline 
 */
function workLoop (deadline) {
	let shouldYield = false
	while (nextUnitOfWork && !shouldYield) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
		shouldYield = deadline.timeRemaining() < 1
	}
	// 一旦本次渲染结束，就可以提交本次更新 当 nextUnitOfWork 为空时表示渲染已经结束
	if (!nextUnitOfWork && workInProgressRoot) {
		commitRoot()
	}

	// 在浏览器的每一帧中，如果主线程为空时浏览器会执行该方法注册的回调， 这与react中能的Scheduler在概念上是相近的， requestIdleCallback方法的   
	// 回调函数会接收到一个剩余时间的参数 deadline
	requestIdleCallback(workLoop)
}

// 浏览器会在空闲的时间调用该方法的回调，实现初次渲染
requestIdleCallback(workLoop)





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
		const isSameType = element && oldFiber && oldFiber.type === element.type



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



/**
 * 函数组件，执行函数方法返回子组件
 * @param {*} fiber 
 */
function updateFunctionComponent (fiber) {
	workInProgressFiber = fiber
	hookIndex = 0
	workInProgressFiber.hooks = []
	// 执行函数组件将props传递个组件
	const children = [fiber.type(fiber.props)]
	reconcileChildren(fiber, children)
}

function updateHostComponent (fiber) {
	if (!fiber.dom) {
		// 真实的 dom 节点存储在fiber.dom上
		fiber.dom = createDom(fiber)
	}
	reconcileChildren(fiber, fiber.props.children)

}






/**
 * 开始工作
 * 核心方法，处理当前工作中的fiber节点，返回下一个要执行的fiber节点，
 * @param {*} fiber 
 * @returns 
 */
function performUnitOfWork (fiber) {
	const isFunctionComponent = fiber.type instanceof Function
	if (isFunctionComponent) {
		updateFunctionComponent(fiber)
	} else {
		updateHostComponent(fiber)
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




/**
 * 触发渲染开始的地方
 * 渲染方法，触发渲染是，该方法会为 nextUnitOfWork， nextUnitOfWork会在 workLoop中使用
 * @param {*} element 
 * @param {*} container 
 */
function render (element, container) {
	// 初次渲染，为 根节点设置 nextUnitOfWork
	workInProgressRoot = {
		dom: container,
		props: {
			children: [element]
		},
		alternate: currentRoot
	}
	deletions = [] // 重置待移除的fiber

	nextUnitOfWork = workInProgressRoot

}




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
		hook.state = action()
	})

	workInProgressFiber.hooks.push(hook)

	const setState = (newValue) => {
		const action = () => newValue
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




const RReact = {
	createElement,
	render,
	useState
}


export default RReact