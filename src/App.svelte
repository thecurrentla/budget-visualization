<script>
  import { LayerCake, Svg } from "layercake";
  import { data } from "./data/data.json";
  import { dataold } from "./data/dataold.json";
  import Treemap from "./Treemap.svelte";
  import Tooltip from "./Tooltip.svelte";
  import { index, group, flatGroup } from "d3-array";
  import { format } from "d3-format";

  let hovered;

  // function handleZoom(event) {
  //   // alert(event.detail);
  //   ({ nodes, root, x, y } = event.detail);
  // }

  const breadcrumbHeight = 80;

  let grouped = group(
    data,
    (d) => d["category"],
    (d) => d["subcategory"],
    (d) => d["name"]
  );
  // console.log(data);
  // console.log(grouped);
  for (let [level1, value1] of grouped) {
    for (let [level2, value2] of value1) {
      if (value1.size === 1 && level2 === "") {
        grouped.set(level1, value2);
      } else if (level2 === "") {
        console.log(level2);
        console.log(value2);

        for (let [level3, value3] of value2) {
          console.log(level3);
          console.log(value3);
          value1.set(level3, value3);
        }
        value1.delete(level2);
      }
    }
  }
  // console.log(grouped);

  const dataTree = grouped;

  function formatDollars(d) {
    return format("$0.3s")(d).replace(/G/, "B").toLowerCase();
  }
</script>

<div class="chart-container">
  <LayerCake data={dataTree} padding={{ top: breadcrumbHeight, right: 0, bottom: 0, left: 0 }}>
    <Svg>
      <svelte:fragment slot="defs">
        <radialGradient id="white-circle" gradientTransform="translate(0.03 -0.09) scale(1.33, 1.34)">
          <stop offset="1%" stop-color="rgba(255, 255, 255, 0.28)" />
          <stop offset="11.8%" stop-color="rgba(255, 255, 255, 0.36)" />
          <stop offset="22.6%" stop-color="rgba(255, 255, 255, 0.44)" />
          <stop offset="33.4%" stop-color="rgba(255, 255, 255, 0.51)" />
          <stop offset="55%" stop-color="rgba(255, 255, 255, 0.67)" />
          <stop offset="64%" stop-color="rgba(255, 255, 255, 0.54)" />
          <stop offset="73%" stop-color="rgba(255, 255, 255, 0.41)" />
          <stop offset="82%" stop-color="rgba(255, 255, 255, 0.27)" />
          <stop offset="100%" stop-color="rgba(255, 255, 255, 0.01)" />
        </radialGradient>
      </svelte:fragment>
      <Treemap bind:hovered {formatDollars} {breadcrumbHeight} />
    </Svg>
    <Tooltip {hovered} {formatDollars} />
  </LayerCake>
</div>

<style>
  .chart-container {
    width: 100%;
    height: 100%;
  }
</style>
