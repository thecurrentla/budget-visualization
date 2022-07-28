<script>
  import { getContext } from "svelte";
  import { fade } from "svelte/transition";
  import { tweened } from "svelte/motion";

  const { width, height } = getContext("LayerCake");
  export let root, x, y, d, i, formatDollars, rootHeight;
  //   $: console.log($width);

  //   console.log(root);
  //   console.log(d);
  $: console.log(root, d);
  $: console.log(root == d);

  //   $: tweenedNode = tweened(
  //     {
  //       x0: x(d.x0),
  //       x1: x(d.x1),
  //       y0: y(d.y0),
  //       y1: y(d.y1),
  //       width: d === root ? $width : x(d.x1) - x(d.x0),
  //       height: d === root ? rootHeight : y(d.y1) - y(d.y0),
  //     },
  //     {
  //       duration: 750,
  //     }
  //   );

  //   $: tweenedNode.set({
  //     x0: x(d.x0),
  //     x1: x(d.x1),
  //     y0: y(d.y0),
  //     y1: y(d.y1),
  //     width: d === root ? $width : x(d.x1) - x(d.x0),
  //     height: d === root ? rootHeight : y(d.y1) - y(d.y0),
  //   });

  function zoomin(d) {
    console.log("zooming in");
    console.log(d);
    // const group0 = group.attr("pointer-events", "none");
    // const group1 = (group = svg.append("g").call(render, d));

    x = x.domain([d.x0, d.x1]);
    y = y.domain([d.y0, d.y1]);

    root = d;

    // svg
    //   .transition()
    //   .duration(750)
    //   .call((t) => group0.transition(t).remove().call(position, d.parent))
    //   .call((t) =>
    //     group1
    //       .transition(t)
    //       .attrTween("opacity", () => d3.interpolate(0, 1))
    //       .call(position, d)
    //   );
  }

  // When zooming out, draw the old nodes on top, and fade them out.
  function zoomout(d) {
    console.log("zooming out");
    // const group0 = group.attr("pointer-events", "none");
    // const group1 = (group = svg.insert("g", "*").call(render, d.parent));

    x.domain([d.parent.x0, d.parent.x1]);
    y.domain([d.parent.y0, d.parent.y1]);

    root = d.parent;

    // svg
    //   .transition()
    //   .duration(750)
    //   .call((t) =>
    //     group0
    //       .transition(t)
    //       .remove()
    //       .attrTween("opacity", () => d3.interpolate(1, 0))
    //       .call(position, d)
    //   )
    //   .call((t) => group1.transition(t).call(position, d.parent));
  }
</script>

<g
  class={`node`}
  transition:fade
  transform={d === root
    ? `translate(0,${-rootHeight})`
    : `translate(${x(d.x0)},${y(d.y0)})`}
  on:click={(event) => (d === root ? zoomout(root) : zoomin(d))}
>
  <rect
    id={`rect-${i}`}
    width={x(d.x1) - x(d.x0)}
    height={d === root ? rootHeight : y(d.y1) - y(d.y0)}
  />
  <clipPath id={`node-${i}`}>
    <use xlink:href={`#rect-${i}`} />
  </clipPath>
  <text class="cat" clip-path={`url(#node-${i})`} x={6} y={"1.2em"}>
    {d.data[0] ? d.data[0] : "Total"}
  </text>
  <text class="value" clip-path={`url(#node-${i})`} x={6} y={"2.6em"}>
    {formatDollars(d.value)}
  </text>
</g>

<style>
  text {
    font-family: "Amiko", sans-serif;
    pointer-events: none;
  }

  .node {
    fill: #d3d3d3;
  }

  .cat {
    font-size: 14px;
    fill: #333;
  }

  .value {
    font-size: 12px;
    fill: #666;
  }
</style>
