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
    .tile(treemapSquarify)
    // .padding(1)
    // .paddingInner(5)
    // .paddingOuter(5)
    .round(false)
    .size([$width, $height]);
  // $: console.log($data);

  $: root = treeMapFn(
    hierarchy($data)
      .sum((d) => d.budget)
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

  function getCategory(d, depth) {
    while (d.depth > depth) d = d.parent;
    return d.data[0];
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
        class={`node depth-${d.depth}`}
        class:root={isEqual(d, root)}
        class:active={some(nodes, d)}
        class:hasChildren={hasChildren(d)}
        class:isSmall={d.value / root.value < 0.035}
        data-category={getCategory(d, 1)}
        style={`--highlight-color: ${isEqual(d, root) ? "#fff" : color[getCategory(d, 1)]}`}
        transform={isEqual(d, root) ? `translate(0,${-breadcrumbHeight})` : `translate(${x(d.x0)},${y(d.y0)})`}
        on:mousemove={(e) => {
          if (!isEqual(d, root)) {
            hovered = { e: e, data: d };
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
          } else if (hasChildren(d)) {
            zoomin(d);
          }
        }}
      >
        <rect
          id={`rect-${i}`}
          width={x(d.x1) - x(d.x0)}
          height={isEqual(d, root) ? $height + breadcrumbHeight : y(d.y1) - y(d.y0)}
          fill={isEqual(d, root) ? "#fff" : color[getCategory(d, 1)]}
          opacity={d.depth == 1 || root.children.length == 1 ? 1 : opacityScale(d.value)}
        />
        {#if d.depth <= 3 || d.depth == 1}
          <foreignObject
            x={0}
            y={0}
            width={x(d.x1) - x(d.x0)}
            height={isEqual(d, root) ? breadcrumbHeight : y(d.y1) - y(d.y0)}
          >
            <div class="label">
              <div class="arrow back" class:visible={isEqual(d, root) && d.depth != 0}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                  <path
                    fill-rule="evenodd"
                    d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-5.904 2.803a.5.5 0 1 0 .707-.707L6.707 6h2.768a.5.5 0 1 0 0-1H5.5a.5.5 0 0 0-.5.5v3.975a.5.5 0 0 0 1 0V6.707l4.096 4.096z"
                  />
                </svg>
              </div>
              <!-- <div class="name">{isEqual(d, root) ? "" : d.data[0]}</div> -->
              <div class="info">
                <div class="name">{d.parent ? d.data[0] : "Total Budget"}</div>
                <div class="value">{formatDollars(d.value)}</div>
              </div>
              {#if hasChildren(d)}
                <div class="arrow expand" class:visible={!isEqual(d, root)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707z"
                    />
                  </svg>
                </div>
              {/if}
            </div>
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
  foreignObject {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial,
      sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    pointer-events: none;
    padding: 0.5rem;
  }

  .node {
    pointer-events: none;
    opacity: 0;
  }

  .node.active {
    pointer-events: all;
    opacity: 1;
    transition: all 1s;
  }

  .node.active.depth-6,
  .node.active.depth-0 {
    cursor: default;
  }

  .node.active rect {
    transition: all 1s;
  }

  .node.active rect:hover {
  }

  .node.hasChildren {
    cursor: pointer;
  }

  rect {
  }
  .rect-stroke {
    fill: none;
    stroke: #333;
    stroke-width: 2;
  }

  /* .node.active {
    pointer-events: all;
    cursor: pointer;
  } */

  .label {
    display: flex;
    flex-flow: row nowrap;
    align-items: flex-start;
    width: 100%;
  }

  .arrow:not(.visible) {
    width: 0;
    opacity: 0;
  }
  .arrow.visible:first-child {
    margin-right: 0.5em;
  }
  .arrow.visible:last-child {
    margin-left: 0.5em;
  }

  .info {
    flex-grow: 1;

    display: flex;
    flex-flow: row wrap;
    align-items: baseline;

    gap: 0.5em;
  }
  .node.root .info {
    display: block;
  }

  .name {
    font-size: 1em;
    font-weight: 600;
  }

  .value {
    font-size: 1.15em;
    font-weight: 800;
  }

  .node.root {
    font-size: 1.2em;
  }
  .node.isSmall {
    font-size: 0.9em;
  }

  *:focus {
    outline: none;
  }
</style>
