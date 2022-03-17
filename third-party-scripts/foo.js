function foo() {
	console.log('this is foo');
}

// console.warn('doc:', document);
// console.warn('doc title', document.title);
// console.warn('height:', innerHeight);

// const span = document.createElement('span');
// span.textContent = 'hello and welcome';

// const span2 = document.createElement('h1');

// const x = {
// 	name: 'yo',
// };

// span2.textContent = x.name;

// document.body.append(span);
// span.after(span2);

// console.log(hello);

document.addEventListener('click', event => {
	console.log(event);
	console.log(event.clientX, innerHeight);
	// console.log(event.clientX);
});

window.bar = {
	value: 'this is bar',
};

window.hi = () => {
	console.log('hi', window.bar);
};
