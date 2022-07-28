<script>
  import { LayerCake, Svg } from "layercake";
  import { data } from "./data/data.json";
  import Treemap from "./Treemap.svelte";
  import Tooltip from "./Tooltip.svelte";
  import { group } from "d3-array";
  import { format } from "d3-format";

  let hovered;

  // function handleZoom(event) {
  //   // alert(event.detail);
  //   ({ nodes, root, x, y } = event.detail);
  // }

  const rootHeight = 60;
  const grouped = group(
    data,
    (d) => d["organization_group"],
    (d) => d.department,
    (d) => d.program,
    (d) => d.character,
    (d) => d.object
  );

  function formatDollars(d) {
    return format("$0.3s")(d).replace(/G/, "B").toLowerCase();
  }

  function handleHover(event) {
    console.log(event.detail);
    hovered = event.detail;
  }
</script>

<main>
  <div class="chart-container">
    <LayerCake data={grouped} padding={{ top: rootHeight, right: 0, bottom: 0, left: 0 }}>
      <Svg>
        <Treemap bind:hovered {formatDollars} {rootHeight} />
      </Svg>
      <!-- <Labels {rootHeight} {nodes} {root} {x} {y} {formatDollars} /> -->
      <Tooltip {hovered} {formatDollars} />
    </LayerCake>
  </div>
</main>

<style>
  main {
    width: 100%;
    height: 100%;
  }

  .chart-container {
    width: 100%;
    height: 100%;
  }
</style>
