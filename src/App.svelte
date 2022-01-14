<script>
	export let appName;
	export let userName;
	export let userStatus;
	export let userAvatar;

	import Header from './components/Header.svelte';
	import UsersList from './components/UsersList.svelte';
	import Chat from './components/Chat.svelte';
	import Input from './components/Input.svelte';

	let chatName = 'main';
</script>

<svelte:head>
  <title>{appName} - #{chatName}</title>
</svelte:head>

<div class="main-container">
	<Header {appName} {userName} {userAvatar} />
	<UsersList {userName} {userAvatar} {userStatus} {chatName} />
	<Chat {chatName} />
	<Input />
</div>