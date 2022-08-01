<script>
  import { getContext } from "svelte";
  import { treemap, hierarchy, treemapBinary, treemapSquarify } from "d3-hierarchy";
  import { scaleLinear } from "d3-scale";
  import { some, isEqual } from "lodash";
  import { fade, fly } from "svelte/transition";
  import { descriptions } from "./data/data.json";

  export let root, formatDollars, breadcrumbHeight;

  const { data, width, height } = getContext("LayerCake");

  const enableLists = false;

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

  // Sort the data by value
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
    .range([0.5, 0.9]);

  // $: renderedNodes = root.children
  //   .concat(root)
  //   .concat(root.children.map((d) => d.children).flat());

  // $: descendants = treeMapFn(
  //   hierarchy($data)
  //     .sum((d) => d.budget)
  //     .sort((a, b) => b.value - a.value)
  // ).descendants();

  function getParents(elem, selector) {
    // Element.matches() polyfill
    if (!Element.prototype.matches) {
      Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function (s) {
          var matches = (this.document || this.ownerDocument).querySelectorAll(s),
            i = matches.length;
          while (--i >= 0 && matches.item(i) !== this) {}
          return i > -1;
        };
    }

    // Set up a parent array
    var parents = [];

    // Push each parent element to the array
    for (; elem && elem !== document; elem = elem.parentNode) {
      if (selector) {
        if (elem.matches(selector)) {
          parents.push(elem);
        }
        continue;
      }
      parents.push(elem);
    }

    // Return our parent array if not empty
    if (parents.length > 0) {
      return parents;
    }

    return false;
  }

  function getID(d, separator = " / ") {
    let id = [];
    id.push(d.data[0]);
    while (d.depth > 1) {
      d = d.parent;
      id.push(d.data[0]);
    }
    return id.reverse().join(separator);
  }

  function getSizeRatio(d, root) {
    return d.value / root.value;
  }

  function getSize(d, root) {
    // if (!isEqual(d, root)) {
    //   console.log(d.data[0]);
    //   console.log(d.value / root.value);
    // }

    const ratio = getSizeRatio(d, root);

    if (ratio === 1) {
      return "full";
    } else if (ratio > 0.5) {
      return "xl";
    } else if (ratio > 0.15) {
      return "lg";
    } else if (ratio > 0.075) {
      return "md";
    } else if (ratio > 0.035) {
      return "sm";
    } else if (ratio > 0.008) {
      return "xs";
    } else {
      return "xxs";
    }
  }

  function getColor(d) {
    const category = getCategory(d, 1);
    switch (category) {
      case "Utilities":
        return "yellow";
      case "Government":
        return "purple";
      case "Infrastructure":
        return "blue";
      case "Public Safety":
        return "red";
      case "Community":
        return "green";
      default:
        console.log(`No color found for ${category}.`);
    }

    return "teal";
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
      document.activeElement.blur();
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
      {@const width = x(d.x1) - x(d.x0)}
      {@const height = isEqual(d, root) ? $height : y(d.y1) - y(d.y0)}

      {@const metadata = descriptions[getID(d)]}

      {@const isRoot = isEqual(d, root)}
      {@const isBottomLevel = getSizeRatio(d, root) === 1}
      {@const isClickable = isEqual(d, root) || (!isEqual(d, root) && getSizeRatio(d, root) !== 1)}

      <g
        class={`node depth-${d.depth} has-theme-${getColor(d)} size-${getSize(d, root)}`}
        class:root={isRoot}
        class:active={some(nodes, d)}
        class:clickable={isClickable}
        transform={isRoot ? `translate(0,${-breadcrumbHeight})` : `translate(${x(d.x0)},${y(d.y0)})`}
        transition:fade={{ duration: 500 }}
      >
        {#if d.depth > 0}
          <rect
            id={`rect-${i}`}
            {width}
            {height}
            class="rect-color"
            opacity={d.depth == 1 || root.children.length == 1 ? 1 : opacityScale(d.value)}
          />
        {/if}
        <foreignObject id={`rect-${i}-fg`} x={0} y={0} {width} {height}>
          <button
            class="wrapper"
            on:click={(event) => {
              if (event.target.tagName === "A" || getParents(event.target, "a[href]")) {
                return false;
              }

              if (isRoot) {
                zoomout(root);
              } else if (isBottomLevel) {
                return false;
              } else {
                zoomin(d);
              }
            }}
          >
            <header class="header">
              {#if hasParent(d) && isRoot}
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
              <div class="title">
                {#if d.parent && d.data.name}
                  <!-- <div class="name" data-bottom="?">{d.data.name ? d.data.name : ""}</div> -->
                  <div class="amount">{d.data.amount ? d.data.amount : ""}</div>
                {:else if isRoot && d.parent}
                  <div class="name">{d.data[0] ? d.data[0] : ""}</div>
                {:else if d.parent}
                  <div class="amount">{formatDollars(d.value)}</div>
                  <div class="name">{d.data[0] ? d.data[0] : ""}</div>
                {:else}
                  <div class="amount">{formatDollars(d.value)}</div>
                  <div class="name">Total Budget</div>
                {/if}
              </div>
              {#if isRoot}
                <div class="info">
                  <!-- add metadata links here eventually, maybe? -->
                </div>
              {/if}
              {#if hasChildren(d) && !isRoot}
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
            {#if !isRoot && getSizeRatio(d, root) > 0.05}
              <div class="content">
                {#if metadata && metadata.description}
                  <div class="description">{metadata.description}</div>
                {/if}
                {#if enableLists && hasChildren(d)}
                  <div class="departments">
                    <p>Includes:</p>
                    <ul>
                      {#each d.children as child}
                        <li>{child.data[0]}</li>
                      {/each}
                    </ul>
                  </div>
                {/if}
                {#if metadata && (metadata.budget_link || metadata.info_link)}
                  <div class="links">
                    {#if metadata.budget_link}
                      <a href={metadata.budget_link} class="" target="_blank">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          class="bi bi-file-earmark-pdf"
                          viewBox="0 0 16 16"
                        >
                          <path
                            d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"
                          />
                          <path
                            d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"
                          />
                        </svg>
                        <span>Budget Details</span>
                        <span class="visually-hidden">(opens PDF document in new window)</span>
                      </a>
                    {/if}
                    {#if metadata.info_link}
                      <a href={metadata.info_link} class="" target="_blank">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"
                          />
                          <path
                            fill-rule="evenodd"
                            d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"
                          />
                        </svg>
                        <span>More About This</span>
                        <span class="visually-hidden">(opens in new window)</span>
                      </a>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          </button>
        </foreignObject>
      </g>
    {/if}
  {/each}
</g>

<style>
  button {
    appearance: none;
    background: none;
    border: none;

    cursor: pointer;

    text-align: left;

    display: block;

    color: black;
  }

  .node {
    pointer-events: none;
    opacity: 0;
  }

  .node.active {
    pointer-events: all;
    opacity: 1;
    transition: all 500ms;
  }
  .node:not(.clickable) button {
    cursor: auto;
  }
  .node.active.depth-0 button {
    cursor: default;
  }

  .node.active rect {
    transition: all 500ms;
  }

  .rect-color {
    fill: var(--theme-color-base);
    stroke: var(--theme-color-darkest);
    stroke-width: 1;
  }
  .node.root .rect-color {
    fill: var(--theme-color-lightest, white);
    stroke-width: 0;
  }

  .wrapper {
    width: 100%;
    height: 100%;
    padding: 0;

    display: flex;
    flex-flow: column;
    align-items: flex-start;
    justify-content: flex-start;

    background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.75), transparent);
    background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.5), transparent),
      radial-gradient(circle at 25% 0%, var(--theme-color-lighter), var(--theme-color-transparent)),
      radial-gradient(ellipse at 80% 120%, var(--theme-color-base), var(--theme-color-transparent));

    transition: background-size 250ms ease, background-color 250ms ease;
  }
  .wrapper:hover,
  .wrapper:focus {
    background-color: var(--theme-color-lighter);
    background-size: 125% 125%;
  }
  .wrapper:hover .arrow,
  .wrapper:focus .arrow {
    /* transform: scale(1.25); */
    /* had to comment out due to safari bug, try again sometime */
  }

  .node.root .wrapper {
    background-color: white;
    background-image: none;
  }

  .node.root:not(.depth-0) .wrapper:hover,
  .node.root:not(.depth-0) .wrapper:focus {
    background-color: var(--theme-color-lighter);
  }

  .header,
  .content {
    padding: min(0.5rem, 0.5em) min(0.75rem, 0.75em);

    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial,
      sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    line-height: 1.3;
  }

  .header {
    display: inline-flex;
    flex-flow: row nowrap;
    align-items: center;
    padding: min(0.5rem, 0.5em) min(0.75rem, 0.75em);
    width: 100%;
  }
  .content {
  }

  .arrow {
    transition: transform 250ms ease;
    transform-origin: center center;
  }
  .arrow:first-child {
    margin-right: 0.5em;
  }
  .arrow:last-child {
    margin-left: 0.5em;
  }

  .title {
    flex-grow: 1;

    display: flex;
    flex-flow: row wrap;
    align-items: baseline;

    gap: 0.125em 0.5em;
    font-size: var(--title-font-size);
  }

  .name {
    font-weight: 700;
  }
  .amount {
    font-weight: 900;
  }

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

  .content {
    font-size: 0.9em;
    font-weight: 600;

    font-size: var(--content-font-size, 1em);
  }

  .content > * + * {
    margin-top: 0.75em;
  }

  .departments {
    font-size: 0.75em;
  }
  .departments ul,
  .departments li {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .departments li {
    margin: 0.25em;
  }

  .node.root,
  .node.size-full {
    font-size: 1.25em;
    --title-font-size: 1.5em;
  }
  .node.size-xl {
    font-size: 1.2em;
    --title-font-size: 1.3em;
  }
  .node.size-lg {
    font-size: 1.1em;
    --title-font-size: 1.2em;
  }
  .node.size-md {
    font-size: 1.05em;
    --title-font-size: 1.1em;
  }
  .node.size-sm {
    font-size: 0.9em;
    --title-font-size: 1.1em;
  }
  .node.size-xs {
    font-size: 0.7em;
    --title-font-size: 1.1em;
  }
  .node.size-xxs {
    font-size: 0.6em;
    --title-font-size: 1.1em;
  }
</style>
