import React from 'react';

import DmmToolbar from './components/toolbar/DmmToolbar.js';

import styles from './App.module.scss';
import Swapper from "./components/swapper/Swapper";

class App extends React.Component {

  render = () => {
    return (
      <>
        <DmmToolbar/>
        <div className={styles.App}>
          <Swapper/>
        </div>
      </>
    );
  }

}

export default App;
