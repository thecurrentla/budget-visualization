<script>
  import { getContext } from "svelte";
  import { treemap, hierarchy, treemapBinary, treemapSquarify } from "d3-hierarchy";
  import { scaleLinear } from "d3-scale";
  import { some, isEqual } from "lodash";
  import { fade, fly } from "svelte/transition";
  import slugify from "@sindresorhus/slugify";

  export let hovered, root, formatDollars, breadcrumbHeight;

  const { data, width, height } = getContext("LayerCake");

  const color = {
    Utilities: "#4dbfdf",
    Government: "#838bc5",
    Infrastructure: "#f8de00",
    "Public Safety": "#f27558",
    Community: "#79a240",
  };

  $: x = scaleLinear().domain([0, $width]).range([0, $width]);
  $: y = scaleLinear().domain([0, $height]).range([0, $height]);

  $: treeMapFn = treemap()
    .tile(treemapBinary)
    // .padding(1)
    // .paddingInner(5)
    // .paddingOuter(5)
    .round(false)
    .size([$width, $height]);
  // $: console.log($data);

  $: root = treeMapFn(
    hierarchy($data)
      .sum((d) => d.amount_num)
      .sort((a, b) => b.value - a.value)
  );
  // $: console.log(root);

  $: nodes = [root].concat(root.children).filter((d) => d.value > 0);
  // $: console.log(nodes);

  $: rootChildrenValues = root.children.map((d) => d.value);
  $: opacityScale = scaleLinear()
    .domain([Math.min(...rootChildrenValues), Math.max(...rootChildrenValues)])
    .range([0.25, 0.75]);

  // $: renderedNodes = root.children
  //   .concat(root)
  //   .concat(root.children.map((d) => d.children).flat());

  // $: descendants = treeMapFn(
  //   hierarchy($data)
  //     .sum((d) => d.budget)
  //     .sort((a, b) => b.value - a.value)
  // ).descendants();

  function getColor(category) {
    switch (category) {
      case "Utilities":
        return "blue";
      case "Government":
        return "purple";
      case "Infrastructure":
        return "yellow";
      case "Public Safety":
        return "red";
      case "Community":
        return "green";
      default:
        console.log(`No color found for ${category}.`);
    }

    return "gray";
  }

  function getCategory(d, depth) {
    while (d.depth > depth) d = d.parent;
    return d.data[0];
  }

  function hasParent(d) {
    // console.log(d);
    if (d.parent) {
      return true;
    }

    return false;
  }

  function hasChildren(d) {
    if (d.children && d.children.length > 1) {
      return true;
    }
    return false;
  }

  // When zooming in, draw the new nodes on top, and fade them in.
  function zoomin(d) {
    // console.log("zoomin");
    if (d.children && d.depth <= 5) {
      x = x.domain([d.x0, d.x1]);
      y = y.domain([d.y0, d.y1]);
      root = d;
    }
  }

  // When zooming out, draw the old nodes on top, and fade them out.
  function zoomout(d) {
    // console.log("zooming out");
    if (d.parent) {
      x.domain([d.parent.x0, d.parent.x1]);
      y.domain([d.parent.y0, d.parent.y1]);
      root = d.parent;
    }
  }
</script>

<g class="treemap-layer">
  {#each nodes as d, i (`${d.data[0]}-${d.depth}-${d.value}`)}
    {#if d.value > 0}
      <g
        class={`node depth-${d.depth} has-theme-${getColor(getCategory(d, 1))}`}
        class:root={isEqual(d, root)}
        class:active={some(nodes, d)}
        class:hasChildren={hasChildren(d)}
        class:isSmall={d.value / root.value < 0.035}
        class:isExtraSmall={d.value / root.value < 0.007}
        transform={isEqual(d, root) ? `translate(0,${-breadcrumbHeight})` : `translate(${x(d.x0)},${y(d.y0)})`}
        on:mousemove={(e) => {
          if (!isEqual(d, root)) {
            // let element = e.target.closest(".node");
            // console.log(e);
            // console.log(element);

            hovered = { e: e, data: d };
            // console.log(hovered);
          }
        }}
        on:mouseout={() => {
          hovered = null;
        }}
        on:blur={() => {
          hovered = null;
        }}
        transition:fade={{ duration: 1000 }}
        on:click={(event) => {
          if (isEqual(d, root)) {
            zoomout(root);
          } else {
            zoomin(d);
          }
        }}
      >
        <rect
          id={`rect-${i}-bg`}
          width={x(d.x1) - x(d.x0)}
          height={isEqual(d, root) ? $height + breadcrumbHeight : y(d.y1) - y(d.y0)}
          class="color"
          opacity={d.depth == 1 || root.children.length == 1 ? 1 : opacityScale(d.value)}
        />
        {#if d.depth <= 5 || d.depth == 1}
          <foreignObject
            x={0}
            y={0}
            width={x(d.x1) - x(d.x0)}
            height={isEqual(d, root) ? breadcrumbHeight : y(d.y1) - y(d.y0)}
          >
            <header class="label">
              {#if hasParent(d) && isEqual(d, root)}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  class="arrow back"
                >
                  <path
                    fill-rule="evenodd"
                    d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-5.904 2.803a.5.5 0 1 0 .707-.707L6.707 6h2.768a.5.5 0 1 0 0-1H5.5a.5.5 0 0 0-.5.5v3.975a.5.5 0 0 0 1 0V6.707l4.096 4.096z"
                  />
                </svg>
              {/if}
              <div class="info">
                {#if d.parent}
                  <div class="value">{formatDollars(d.value)}</div>
                  <div class="name">{d.data[0] ? d.data[0] : ""}</div>
                {:else}
                  <div class="value">{formatDollars(d.value)}</div>
                  <div class="name">Total Budget</div>
                {/if}
              </div>
              {#if hasChildren(d) && !isEqual(d, root)}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  class="arrow expand"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707z"
                  />
                </svg>
              {/if}
            </header>
          </foreignObject>
        {:else if d.depth > 5}
          <!-- else if content here -->
        {:else}
          <text class="name" x={8} y={0}>...</text>
        {/if}
      </g>
    {/if}
    {#if hovered}
      <rect
        transform={`translate(${x(hovered.data.x0)},${y(hovered.data.y0)})`}
        class="rect-stroke"
        width={x(hovered.data.x1) - x(hovered.data.x0)}
        height={isEqual(hovered.data, root) ? $height : y(hovered.data.y1) - y(hovered.data.y0)}
      />
    {/if}
  {/each}
</g>

<style>
  button {
    appearance: none;
    background: none;
    border: none;

    cursor: pointer;
  }

  .node {
    pointer-events: none;
    opacity: 0;
  }

  .node.active {
    pointer-events: all;
    opacity: 1;
    transition: all 1s;
    cursor: pointer;
  }

  .node.active.depth-6,
  .node.active.depth-0 {
    cursor: default;
  }

  .node.active rect {
    transition: all 1s;
  }
  .node.root rect.color {
    fill: var(--theme-color-lightest);
  }

  .node.active rect:hover {
  }

  .node.hasChildren {
  }

  rect.color {
    fill: var(--theme-color-light);
  }

  .rect-stroke {
    fill: none;
    stroke: #333;
    stroke-width: 2;
  }

  .label {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    width: 100%;
    padding: min(0.5rem, 0.5em) min(0.75rem, 0.75em);
    /* background: var(--theme-color-dark); */

    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial,
      sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    line-height: 1.3;
  }

  .arrow:not(.visible) {
    /* width: 0;
    opacity: 0; */
  }
  .arrow:first-child {
    margin-right: 0.5em;
  }
  .arrow:last-child {
    margin-left: 0.5em;
  }

  .info {
    flex-grow: 1;

    display: flex;
    flex-flow: row wrap;
    align-items: baseline;

    gap: 0.125em 0.5em;
    font-size: 1.125em;
  }

  .name {
    font-weight: 700;
  }

  .value {
    font-weight: 900;
  }

  .node.root {
    font-size: 1.5em;
  }
  .node.isSmall {
    font-size: 0.875em;
  }
  .node.isExtraSmall {
    font-size: 0.7em;
  }
</style>
