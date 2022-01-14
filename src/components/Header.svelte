<script>
	export let appName = "AppName";
	export let userName = "Unknown";
	export let userAvatar = "img/users/unknownUser.png";
</script>

<div id="header">
    <div class="container">
        <div class="logo">{appName}</div>
        <div class="user">
            <p>{userName}</p>
            <img src={userAvatar} alt="avatar"/>
        </div>
    </div>
</div>