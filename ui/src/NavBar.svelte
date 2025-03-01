<script lang="ts">
  import NavButton from './NavButton.svelte'
  import Magnify from 'svelte-material-icons/Magnify.svelte'
  import Forum from 'svelte-material-icons/Forum.svelte'
  import { currentRoute } from './stores/navigation';

  function navigate(path: string) {
    currentRoute.set({ path });
  }
</script>

<div
  style="width: 100%; height: 64px; background-color: black; display: flex; align-items: center; justify-content: space-between;"
>
  <div style="padding: 0px 16px 0px; 16px display: flex: gap: 8px;">
    <NavButton onClick={() => navigate('/rooms')}>
      <Forum
        height="54px"
        width="40px"
        color={$currentRoute.path === '/rooms' ? '#7b1fa2' : 'white'}
      />
    </NavButton>
  </div>
  <div style="padding: 0px 16px 0px; 16px display: flex: gap: 8px;">
    <NavButton onClick={() => navigate('/search')}>
      <Magnify
        height="50px"
        width="45px"
        color={$currentRoute.path === '/search' ? '#7b1fa2' : 'white'}
      />
    </NavButton>
  </div>
</div>
