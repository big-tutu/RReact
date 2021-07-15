import React, {Suspense} from 'react';
import { unstable_createResource } from 'react-cache'; // 当前还未有稳定的版本，但是 React 官方提供了一个独立的包



const getSomething = (something) => new Promise((resolve) => {
  setTimeout(() => {
    resolve(something);
  }, 1000);
})

// 第一步
const resource = unstable_createResource((id) => getSomething(id));

// 第二步
function LoadData () {
	const data = resource.read(666);
	return (
		<div>{data}</div>
	)
}

// // 第三步
export default () => {
	return (
		<Suspense fallback={<div>loading</div>}>
			<LoadData />
		</Suspense>
	)
}
