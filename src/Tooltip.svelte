<script>
  import { getContext } from "svelte";
  import { format } from "d3-format";
  import { descriptions } from "./data/data";

  export let hovered, formatDollars;

  const { width, height } = getContext("LayerCake");
  const offset = 10;
  let tooltipWidth, tooltipHeight;

  $: if (hovered) {
    // console.log(breadcrumbHeight);
    // console.log(hovered.data);
    // console.log(formatDollars(hovered.data.value));
  }

  function getBreadcrumb(d) {
    let breadcrumb = [];
    while (d.depth > 1) {
      d = d.parent;
      breadcrumb.push(d.data[0]);
    }
    return breadcrumb.reverse().join(" → ");
  }
</script>

<div
  bind:clientWidth={tooltipWidth}
  bind:clientHeight={tooltipHeight}
  class={`tooltip`}
  class:active={hovered}
  style={hovered &&
    hovered.e &&
    `top: ${
      hovered.e.offsetY + tooltipHeight / 2 > $height
        ? hovered.e.offsetY - tooltipHeight
        : hovered.e.offsetY - tooltipHeight / 2
    }px; left: ${
      hovered.e.offsetX + tooltipWidth + offset > $width
        ? hovered.e.offsetX - tooltipWidth - offset
        : hovered.e.offsetX + offset
    }px;`}
>
  {#if hovered}
    <div class="breadcrumb">{getBreadcrumb(hovered.data)}</div>
    {#if hovered.data.data[0]}
      <div class="cat">
        {hovered.data.data[0]}
      </div>
    {/if}
    {#if descriptions[hovered.data.data[0]]}
      <div class="description">{descriptions[hovered.data.data[0]]}</div>
    {:else if hovered.data.data[1] && hovered.data.data[1][0] && hovered.data.data[1][0].description}
      <div class="description">{hovered.data.data[1][0].description}</div>
    {:else}
      <div class="description" />
    {/if}

    <div class="value">{formatDollars(hovered.data.value)}</div>
  {/if}
</div>

<style>
  .tooltip {
    border: 1px solid var(--gray-light);
    border-radius: 3px;
    position: absolute;
    visibility: hidden;
    pointer-events: none;
    padding: 0.75rem;
    background-color: rgba(255, 255, 255, 0.9);
    width: 240px;
    z-index: 99;
  }
  .tooltip.active {
    visibility: visible;
  }
  .breadcrumb {
    font-size: 0.75em;
    color: #666;
    margin-bottom: 0.25em;
  }
  .cat {
    font-size: 0.9em;
    font-weight: 600;
    margin-bottom: 0.125em;
  }

  .description {
    font-size: 1em;
    color: #666;
  }

  .value {
    font-size: 2em;
    font-weight: 600;
  }
</style>
