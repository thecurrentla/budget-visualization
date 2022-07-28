<script>
  import { getContext } from "svelte";
  import {
    treemap,
    hierarchy,
    treemapBinary,
    treemapSquarify,
  } from "d3-hierarchy";
  import { scaleLinear } from "d3-scale";
  import { some, isEqual } from "lodash";
  // import Node from "./Node.svelte";
  import { flatGroup } from "d3-array";
  import { fade, fly } from "svelte/transition";

  export let hovered, formatDollars, rootHeight;

  const { data, width, height } = getContext("LayerCake");

  const color = {
    "Public Works, Transportation & Commerce": "#f15f27",
    "Human Welfare & Neighborhood Development": "#25c2e4",
    "Community Health": "#ffca42",
    "Public Protection": "#ffebe3",
    "General Administration & Finance": "#d6f8ff",
    "General City Responsibilities": "#efbbcc",
    "Culture & Recreation": "#7DDF64",
  };

  $: x = scaleLinear().domain([0, $width]).range([0, $width]);
  $: y = scaleLinear().domain([0, $height]).range([0, $height]);

  $: treeMapFn = treemap()
    .tile(treemapBinary)
    // .padding(1)
    // .paddingInner(1)
    // .paddingOuter(1)
    .round(false)
    .size([$width, $height]);
  // $: console.log($data);

  $: root = treeMapFn(
    hierarchy($data)
      .sum((d) => d.budget)
      .sort((a, b) => b.value - a.value)
  );

  $: nodes = [root].concat(root.children).filter((d) => d.value > 0);
  // $: console.log(nodes);

  $: rootChildrenValues = root.children.map((d) => d.value);
  $: opacityScale = scaleLinear()
    .domain([Math.min(...rootChildrenValues), Math.max(...rootChildrenValues)])
    .range([0.5, 1]);

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

  function getBreadcrumb(d) {
    let result = [];
    while (d.depth >= 1) {
      result.push(d.data[0]);
      d = d.parent;
    }
    return result.join(">");
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
        transform={isEqual(d, root)
          ? `translate(0,${-rootHeight})`
          : `translate(${x(d.x0)},${y(d.y0)})`}
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
        on:click={(event) => (isEqual(d, root) ? zoomout(root) : zoomin(d))}
      >
        <rect
          id={`rect-${i}`}
          width={x(d.x1) - x(d.x0)}
          height={isEqual(d, root) ? $height : y(d.y1) - y(d.y0)}
          fill={isEqual(d, root) ? "#fff" : color[getCategory(d, 1)]}
          opacity={d.depth == 1 || root.children.length == 1
            ? 1
            : opacityScale(d.value)}
        />
        {#if d.depth <= 5 && d.value / root.value > 0.035 || d.depth == 1}
          <!-- <clipPath id={`node-${i}`}>
      <use xlink:href={`#rect-${i}`} />
    </clipPath> -->
          <!-- <text class="cat" clip-path={`url(#node-${i})`} x={6} y={10}>
      {isEqual(d, root) && d.data[0] && d.depth > 2
        ? `${getCategory(d, 2)} > ${d.data[0]}`
        : d.data[0]
        ? d.data[0]
        : "Budget"}
    </text>
    <text
      class="value"
      clip-path={`url(#node-${i})`}
      x={6}
      y={isEqual(d, root) ? 35 : 25}
    >
      {formatDollars(d.value)}
    </text> -->
          <foreignObject
            x={0}
            y={0}
            width={x(d.x1) - x(d.x0)}
            height={isEqual(d, root) ? rootHeight : y(d.y1) - y(d.y0)}
          >
            <div class="cat">{isEqual(d, root) ? "Budget" : d.data[0]}</div>
            <div class="value">{formatDollars(d.value)}</div>
          </foreignObject>
        {:else if d.depth > 5}
          <!-- else if content here -->
        {:else}
          <text class="cat" x={8} y={0}>...</text>
        {/if}
      </g>
    {/if}
    {#if hovered}
      <rect
        transform={`translate(${x(hovered.data.x0)},${y(hovered.data.y0)})`}
        class="rect-stroke"
        width={x(hovered.data.x1) - x(hovered.data.x0)}
        height={isEqual(hovered.data, root)
          ? $height
          : y(hovered.data.y1) - y(hovered.data.y0)}
      />
    {/if}
  {/each}
</g>

<style>
  foreignObject {
    font-family: "Amiko", sans-serif;
    pointer-events: none;
    padding: 0.5rem;
  }
  /* div {
    font-family: "Amiko", sans-serif;
    pointer-events: none;
  } */

  text {
    font-family: "Amiko", sans-serif;
    pointer-events: none;
    alignment-baseline: hanging;
    fill: #333;
  }

  .node {
    pointer-events: none;
    opacity: 0;
  }

  .node.active {
    pointer-events: all;
    opacity: 1;
    cursor: pointer;
    transition: all 1s;
  }

  .node.active.depth-6,
  .node.active.depth-0 {
    cursor: default;
  }

  .node.active rect {
    transition: all 1s;
  }

  /* .node {
    cursor: pointer;
  } */

  .node.active rect:hover {
    /* stroke: #333;
    stroke-width: 2; */
  }

  .rect-stroke {
    fill: none;
    stroke: #333;
    stroke-width: 2;
  }

  rect {
    stroke: white;
  }

  /* .node.active {
    pointer-events: all;
    cursor: pointer;
  } */

  .cat {
    font-size: 16px;
    /* font-weight: 600; */
  }

  .value {
    font-size: 20px;
    font-weight: 600;
  }

  @media only screen and (max-width: 600px) {
    .cat {
      font-size: 12px;
      /* font-weight: 600; */
    }

    .value {
      font-size: 14px;
    }
  }

  .node.root .cat {
    font-size: 18px;
  }

  .node.root .value {
    font-size: 22px;
  }

  *:focus {
    outline: none;
  }
</style>
