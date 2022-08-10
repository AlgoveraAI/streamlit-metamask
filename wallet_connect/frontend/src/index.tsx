import React from "react"
import ReactDOM from "react-dom"
import MyComponent from "./MyComponent"
import OceanDataComponent from "./OceanDataComponent"

ReactDOM.render(
  <React.StrictMode>
    <MyComponent />
    <OceanDataComponent />
  </React.StrictMode>,
  document.getElementById("root")
)
