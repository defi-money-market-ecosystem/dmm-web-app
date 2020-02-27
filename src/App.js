import React from 'react';

import TopSection from './components/TopSection/TopSection';
import DmmToolbar from './components/toolbar/DmmToolbar.js';

import styles from './App.module.scss';
import Swapper from "./components/swapper/Swapper";

class App extends React.Component {
  constructor(props) {
    super(props);


  }

  render = () => {
    return (
      <>
        <DmmToolbar/>
        <TopSection/>
        <div className={styles.App}>
          <Swapper/>
        </div>
      </>
    );
  }

}

export default App;
