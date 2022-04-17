function addBazz() {
	console.log('add bazza.js for mainthread');
	const script = document.createElement('script');
	script.src = '/third-party-scripts/bazz.js';
	document.body.append(script);
}

window.addEventListener('load', () => {
	setTimeout(addBazz, 300);
});
