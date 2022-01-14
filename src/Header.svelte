<script>
	export let appName;
	export let userName;
	export let userAvatar;
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