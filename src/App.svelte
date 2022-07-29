<script>
  import { LayerCake, Svg } from "layercake";
  import { data } from "./data/data.json";
  import { dataold } from "./data/dataold.json";
  import Treemap from "./Treemap.svelte";
  import Tooltip from "./Tooltip.svelte";
  import { index, group, flatGroup } from "d3-array";
  import { format } from "d3-format";

  let hovered;
  let root;

  // function handleZoom(event) {
  //   // alert(event.detail);
  //   ({ nodes, root, x, y } = event.detail);
  // }

  const breadcrumbHeight = 60;

  let grouped = group(
    data,
    (d) => d["category"],
    (d) => d["subcategory"],
    (d) => d["name"]
  );
  console.log(data);
  console.log(grouped);
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
  console.log(grouped);

  const dataTree = grouped;

  function formatDollars(d) {
    return format("$0.3s")(d).replace(/G/, "B").toLowerCase();
  }
</script>

<div class="chart-container">
  <LayerCake data={dataTree} padding={{ top: breadcrumbHeight, right: 0, bottom: 0, left: 0 }}>
    <Svg>
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
