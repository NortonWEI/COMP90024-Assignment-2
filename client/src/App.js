/**
 * @author: Dafu Ai
 */

import React from 'react';
import './App.css';
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import {MuiThemeProvider, createMuiTheme}from "@material-ui/core/styles";
import Home from "./components/Home";
import CssBaseline from "@material-ui/core/CssBaseline";

const theme = createMuiTheme({
});

class App extends React.Component {
  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <div className="App">
          <AppBar position="sticky">
            <Toolbar>
              <Typography variant="h6" color="inherit" noWrap>
                Visualisation Demo
              </Typography>
            </Toolbar>
          </AppBar>
          <Home/>
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
