import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		appName: 'ChatApp',
		userName: 'Artem Darkov',
		userStatus: 'online',
		userAvatar: 'img/users/user0.png'
	}
});

export default app;