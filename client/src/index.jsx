import React from "react"
import ReactDOM from "react-dom"
import App from "./App"
import GlobalStyles from "./styles/globalStyles.styles"
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(
    <>
        <GlobalStyles />
        <App />
        <script
  src="https://unpkg.com/react-bootstrap@next/dist/react-bootstrap.min.js"
  crossorigin></script>
    </>,
    document.getElementById("root")
)