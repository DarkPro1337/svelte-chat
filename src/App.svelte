<script>
	export let appName;
	export let userName;
	export let userStatus;
	export let userAvatar;
	import Header from './Header.svelte';
	import UsersList from './UsersList.svelte';
</script>

<div class="main-container">
	<Header {appName} {userName} {userAvatar} />
	<UsersList />
	<div id="users-chat">
		<p class="start-message">This is beggining of the #main chat</p>
		
		<div class="message">
			<img src="img/users/user2.png" alt="avatar">
			<div class="body">
				<p class="name">Maria Mango</p>
				<p class="text">Hello, team! Sent some task updates to Jira!</p>
			</div>
		</div>

		<div class="message">
			<img src="img/users/user3.png" alt="avatar">
			<div class="body">
				<p class="name">Ashlynn Bator</p>
				<p class="text">Wow, this new chat is awesome!</p>
			</div>
		</div>

		<div class="message">
			<img src="img/users/user5.png" alt="avatar">
			<div class="body">
				<p class="name">Cooper Westervelt</p>
				<p class="text">Yep, already seen this task update, working on it.</p>
			</div>
		</div>
		<div class="message">
			<div class="body">
				<p class="text"><b>@Kadin_Vaccaro</b>, are you checked it?</p>
			</div>
		</div>

		<div class="user-message">
			<div class="body">
				<p class="text">Yep, frontend part on me. Already working on it.</p>
			</div>
		</div>
		<div class="user-message">
			<div class="body">
				<p class="text">Figma mockup already done, started the HTML.</p>
			</div>
		</div>

		<div class="message">
			<img src="img/users/user5.png" alt="avatar">
			<div class="body">
				<p class="name">Cooper Westervelt</p>
				<p class="text">Happy to hear it!</p>
			</div>
		</div>
	</div>
	<div id="footer">
		<div class="container">
			<div class="attachment"><i class="fas fa-paperclip"></i></div>
			<div class="input">
				<input class="itself" type="text" placeholder="Write a message...">
			</div>
			<div class="emoji"><i class="fas fa-grin-alt"></i></div>
			<div class="send"><i class="fas fa-paper-plane"></i></div>
		</div>
	</div>
</div>