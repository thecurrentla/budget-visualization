<script>
  export let budgetLink, infoLink, linkClass;

  export let budgetLinkText = "Budget Details";
  export let infoLinkText = "More About This";
</script>

<div class="links">
  {#if budgetLink}
    <a href={budgetLink} class={linkClass} target="_blank">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <use xlink:href="#icon-file-earmark-pdf" />
      </svg>
      <span>{budgetLinkText}</span>
      <span class="visually-hidden">(opens PDF document in new window)</span>
    </a>
  {/if}
  {#if infoLink}
    <a href={infoLink} class={linkClass} target="_blank">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <use xlink:href="#icon-box-arrow-up-right" />
      </svg>
      <span>{infoLinkText}</span>
      <span class="visually-hidden">(opens in new window)</span>
    </a>
  {/if}
</div>

<style>
  .links {
    font-size: 0.8em;
  }
  .links a {
    display: inline-flex;
    flex-flow: row nowrap;
    align-items: baseline;

    margin: 0.5em 1em 0 0;
  }
  .links a > * + * {
    margin-left: 0.25em;
  }
</style>
