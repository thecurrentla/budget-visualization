<script>
  import { isEqual } from "lodash";
  export let nodes, root, breadcrumbHeight, formatDollars, x, y;

  //   function getCategory(d, depth) {
  //     while (d.depth > depth) d = d.parent;
  //     return d.data[0];
  //   }
</script>

<div class="labels">
  {#if nodes && root}
    {#each nodes as d}
      {#if d.depth <= 5 && d.value / root.value > 0.01}
        <div
          class="label"
          class:root={isEqual(d, root)}
          style={`left: ${isEqual(d, root) ? 0 : x(d.x0)}px; top: ${
            isEqual(d, root) ? -breadcrumbHeight : y(d.y0)
          }px; max-width: ${x(d.x1) - x(d.x0)}px`}
        >
          <div class="cat">{isEqual(d, root) ? "Budget" : d.data[0]}</div>
          <div class="value">{formatDollars(d.value)}</div>
        </div>
      {/if}
    {/each}
  {/if}
</div>
l

<style>
  .labels {
    font-family: "Amiko", sans-serif;
    position: relative;
    top: 60px;
    pointer-events: none;
  }
  .label {
    position: absolute;
  }

  .cat {
    padding: 10px 0 0 6px;
  }

  .value {
    padding: 0 0 0 6px;
    font-weight: 600;
    font-size: 1.15rem;
  }

  .root .cat {
    font-size: 16px;
  }

  .root .value {
    font-size: 22px;
  }
</style>
