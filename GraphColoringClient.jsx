"use client"

import { useEffect, useState, useRef } from "react"
import Head from "next/head"

// CSS styles as a string to be injected
const styles = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
  }

  h1 {
    margin: 0;
    color: #333;
  }
}

@layer components {
  .container {
    max-width: 800px;
    margin: 0 auto;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 20px;
  }

  header {
    text-align: center;
    margin-bottom: 20px;
  }

  .subtitle {
    color: #666;
    margin-top: 5px;
  }

  .palette {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-bottom: 20px;
  }

  .palette-color {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #ddd;
    cursor: grab;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
  }

  .palette-color:active {
    cursor: grabbing;
  }

  .graph-container {
    position: relative;
    height: 400px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 20px;
    background-color: white;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }

  .colors-used {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .count {
    background-color: #f0f0f0;
    padding: 5px 10px;
    border-radius: 4px;
    font-weight: bold;
  }

  .buttons {
    display: flex;
    gap: 10px;
  }

  button {
    padding: 8px 16px;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background-color: #e0e0e0;
  }

  .instructions {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #ddd;
  }

  .footer {
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
    color: #666;
  }

  .vertex-drop-hover {
    stroke: #2196f3 !important;
    stroke-width: 4 !important;
  }
}
`

// Inject styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style")
  styleElement.innerHTML = styles
  document.head.appendChild(styleElement)
}

export default function GraphColoringClient() {
  const COLORS = [
    { id: 0, color: "#e53935", name: "Red" },
    { id: 1, color: "#43a047", name: "Green" },
    { id: 2, color: "#1e88e5", name: "Blue" },
    { id: 3, color: "#fdd835", name: "Yellow" },
    { id: 4, color: "#8e24aa", name: "Purple" },
    { id: 5, color: "#fb8c00", name: "Orange" },
  ]

  const [graph, setGraph] = useState({ vertices: [], edges: [] })
  const [minimumColors, setMinimumColors] = useState(0)
  const [dragColorId, setDragColorId] = useState(null)
  const [colorsCount, setColorsCount] = useState(0)
  const svgRef = useRef(null)

  useEffect(() => {
    generateNewGraph()
  }, [])

  useEffect(() => {
    updateColorsCount()
  }, [graph])

  const createPalette = () => {
    return COLORS.map((color) => (
      <div
        key={color.id}
        className="palette-color"
        style={{ backgroundColor: color.color }}
        draggable="true"
        data-color-id={color.id}
        onDragStart={() => setDragColorId(color.id)}
        onDragEnd={() => setDragColorId(null)}
      />
    ))
  }

  const generateNewGraph = () => {
    if (!svgRef.current) return

    const svgRect = svgRef.current.getBoundingClientRect()
    const width = svgRect.width
    const height = svgRect.height
    const vertexCount = Math.floor(Math.random() * 4) + 3

    const newGraph = generateRandomGraph(vertexCount, width, height)
    const minColors = calculateMinimumColors(newGraph)

    setGraph(newGraph)
    setMinimumColors(minColors)
  }

  const generateRandomGraph = (n, width, height) => {
    const vertices = []
    const padding = 50

    for (let i = 0; i < n; i++) {
      vertices.push({
        id: i,
        x: padding + Math.random() * (width - 2 * padding),
        y: padding + Math.random() * (height - 2 * padding),
        color: null,
      })
    }

    const edges = []
    for (let i = 1; i < n; i++) {
      const target = i
      const source = Math.floor(Math.random() * i)
      edges.push({
        source,
        target,
        hasConflict: false,
      })
    }

    const additionalEdges = Math.floor(0.5 * (n - 1))
    for (let i = 0; i < additionalEdges; i++) {
      let source = Math.floor(Math.random() * n)
      let target = Math.floor(Math.random() * n)

      while (
        source === target ||
        edges.some((e) => (e.source === source && e.target === target) || (e.source === target && e.target === source))
      ) {
        source = Math.floor(Math.random() * n)
        target = Math.floor(Math.random() * n)
      }

      edges.push({
        source,
        target,
        hasConflict: false,
      })
    }

    return { vertices, edges }
  }

  const calculateMinimumColors = (graph) => {
    const { vertices, edges } = graph
    const verticesCopy = vertices.map((v) => ({ ...v, color: null }))
    const adjacencyList = {}

    vertices.forEach((vertex) => {
      adjacencyList[vertex.id] = []
    })

    edges.forEach((edge) => {
      adjacencyList[edge.source].push(edge.target)
      adjacencyList[edge.target].push(edge.source)
    })

    const sortedVertices = [...verticesCopy].sort((a, b) => adjacencyList[b.id].length - adjacencyList[a.id].length)

    let maxColorUsed = -1
    for (const vertex of sortedVertices) {
      const neighborColors = new Set()
      adjacencyList[vertex.id].forEach((neighborId) => {
        const neighbor = verticesCopy.find((v) => v.id === neighborId)
        if (neighbor && neighbor.color !== null) {
          neighborColors.add(neighbor.color)
        }
      })

      let colorToUse = 0
      while (neighborColors.has(colorToUse)) {
        colorToUse++
      }

      const vertexToUpdate = verticesCopy.find((v) => v.id === vertex.id)
      if (vertexToUpdate) {
        vertexToUpdate.color = colorToUse
        maxColorUsed = Math.max(maxColorUsed, colorToUse)
      }
    }

    return maxColorUsed + 1
  }

  const assignColor = (vertexId, colorId) => {
    const updatedGraph = { ...graph }
    const vertex = updatedGraph.vertices.find((v) => v.id === vertexId)

    if (!vertex) return

    vertex.color = colorId

    updatedGraph.edges.forEach((edge) => {
      const source = updatedGraph.vertices.find((v) => v.id === edge.source)
      const target = updatedGraph.vertices.find((v) => v.id === edge.target)

      const hasConflict =
        source && target && source.color !== null && target.color !== null && source.color === target.color

      edge.hasConflict = hasConflict
    })

    setGraph(updatedGraph)
    checkAllColored()
  }

  const resetColors = () => {
    const updatedGraph = { ...graph }

    updatedGraph.vertices.forEach((vertex) => {
      vertex.color = null
    })

    updatedGraph.edges.forEach((edge) => {
      edge.hasConflict = false
    })

    setGraph(updatedGraph)
  }

  const updateColorsCount = () => {
    const uniqueColors = new Set(graph.vertices.map((vertex) => vertex.color).filter((color) => color !== null))

    setColorsCount(uniqueColors.size)
  }

  const checkAllColored = () => {
    const allColored = graph.vertices.every((vertex) => vertex.color !== null)
    const hasConflicts = graph.edges.some((edge) => edge.hasConflict)

    if (allColored && !hasConflicts) {
      const uniqueColors = new Set(graph.vertices.map((vertex) => vertex.color).filter((color) => color !== null))

      if (uniqueColors.size === minimumColors) {
        alert(`Congratulations! You used the minimum number of colors (${minimumColors})!`)
      } else {
        alert(
          `All vertices colored! You used ${uniqueColors.size} colors, but the minimum possible is ${minimumColors}.`,
        )
      }
    }
  }

  const handleDragOver = (e, vertexId) => {
    e.preventDefault()
    e.currentTarget.classList.add("vertex-drop-hover")
  }

  const handleDragLeave = (e, vertexId) => {
    e.currentTarget.classList.remove("vertex-drop-hover")
  }

  const handleDrop = (e, vertexId) => {
    e.preventDefault()
    e.currentTarget.classList.remove("vertex-drop-hover")

    if (dragColorId !== null) {
      assignColor(vertexId, dragColorId)
    }
  }

  return (
    <html lang="en">
      <Head>
        <title>Graph Coloring Challenge</title>
        <meta name="description" content="Solve graph coloring puzzles" />
      </Head>
      <body>
        <div className="container">
          <header>
            <h1>Graph Coloring Challenge</h1>
            <p className="subtitle">Drag a color onto a vertex. No two adjacent vertices can share the same color!</p>
          </header>

          <div className="palette" id="palette">
            {createPalette()}
          </div>

          <div className="instructions">
            <p>Drag a color from the palette and drop it on a vertex. Adjacent vertices must have different colors.</p>
            <p>When all vertices are colored, you&apos;ll see if you used the minimum number of colors!</p>
          </div>

          <div className="controls">
            <div className="colors-used">
              <span>Colors used:</span>
              <span className="count" id="colors-count">
                {colorsCount}
              </span>
            </div>
            <div className="buttons">
              <button id="reset-btn" onClick={resetColors}>
                Reset
              </button>
              <button id="new-graph-btn" onClick={generateNewGraph}>
                New Graph
              </button>
            </div>
          </div>

          <div className="graph-container">
            <svg id="graph-svg" width="100%" height="100%" ref={svgRef}>
              {graph.edges.map((edge, index) => {
                const source = graph.vertices.find((v) => v.id === edge.source)
                const target = graph.vertices.find((v) => v.id === edge.target)

                if (!source || !target) return null

                return (
                  <line
                    key={`edge-${index}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={edge.hasConflict ? "#f44336" : "#aaa"}
                    strokeWidth={edge.hasConflict ? 3 : 2}
                  />
                )
              })}

              {graph.vertices.map((vertex) => (
                <g key={`vertex-${vertex.id}`}>
                  <circle
                    cx={vertex.x}
                    cy={vertex.y}
                    r={20}
                    fill={vertex.color !== null ? COLORS[vertex.color].color : "#fff"}
                    stroke="#333"
                    strokeWidth={2}
                    data-vertex-id={vertex.id}
                    tabIndex={0}
                    onDragOver={(e) => handleDragOver(e, vertex.id)}
                    onDragLeave={(e) => handleDragLeave(e, vertex.id)}
                    onDrop={(e) => handleDrop(e, vertex.id)}
                  />
                  <text
                    x={vertex.x}
                    y={vertex.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="black"
                    fontSize={12}
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {vertex.id + 1}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="footer">
            <p>Graph coloring is used in scheduling, map-making, and more!</p>
          </div>
        </div>
      </body>
    </html>
  )
}
