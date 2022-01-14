<script>
	export let userName = "Unknown";
	export let userStatus = "offline";
	export let userAvatar = "img/users/unknownUser.png";
    export let chatName = "unknown";
</script>

<div id="users-list">
    <div class="selected-chat">#{chatName}</div>
    <div class="user">
        <img src={userAvatar} alt="avatar">
        <p class="name">{userName}</p>
        <p class="status">{userStatus}</p>
    </div>
    <!-- DUMMIES USERS
         TODO: Make it working through Svelte
    <div class="user">
        <img src="/img/users/user2.png" alt="avatar">
        <p class="name">Maria Mango</p>
        <p class="status">online</p>
    </div>
    <div class="user">
        <img src="/img/users/user3.png" alt="avatar">
        <p class="name">Ashlynn Bator</p>
        <p class="status">online</p>
    </div>
    <div class="user">
        <img src="/img/users/user4.png" alt="avatar">
        <p class="name">Kaylynn Schleifer</p>
        <p class="status">online</p>
    </div>
    <div class="user">
        <img src="/img/users/user5.png" alt="avatar">
        <p class="name">Cooper Westervelt</p>
        <p class="status">online</p>
    </div>
    <div class="user">
        <img src="/img/users/user6.png" alt="avatar">
        <p class="name">Alena Lubin</p>
        <p class="status">online</p>
    </div>
    <div class="user">
        <img src="/img/users/user7.png" alt="avatar">
        <p class="name">Phillip Torff</p>
        <p class="status">online</p>
    </div>
    <div class="user">
        <img src="/img/users/user8.png" alt="avatar">
        <p class="name">Anika Bergson</p>
        <p class="status">online</p>
    </div>
    -->
</div>