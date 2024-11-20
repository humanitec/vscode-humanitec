import React, { useEffect, useState } from 'react';
import './App.css';
import { rgba } from 'polished';
import {
  ActiveResource,
  DeploymentObject,
  GraphTheme,
  ResourceDefinition,
  ResourceDependencyGraph,
  ResourceDependencyGraphModel,
  ResourceType,
} from '@humanitec/resource-graph';
import styled, { ThemeProvider } from 'styled-components';
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';

import '@xyflow/react/dist/style.css';

interface vscode {
  postMessage(message: unknown): void;
}
declare const vscode: vscode;

interface resourceDependencyGraphData {
  activeResources: ActiveResource[];
  deployment: DeploymentObject;
  dependencyGraph: ResourceDependencyGraphModel;
  resourceDefinitions: ResourceDefinition[];
  resourceTypes: ResourceType[];
}

const Wrapper = styled.div`
  display: flex;
  align-content: center;
  height: 100%;
  flex: 1;
  background-color: ${({ theme }) => theme.color.base};
`;

function App() {
  const [resourceDependencyGraphData, setResourceDependencyGraphData] =
    useState<resourceDependencyGraphData | null>(null);

  useEffect(() => {
    window.addEventListener('message', (e: MessageEvent) => {
      const msg: MessageEvent = e;

      switch (msg.data.type) {
        case 'resource-dependency-graph-data': {
          const {
            activeResources,
            deployment,
            dependencyGraph,
            resourceDefinitions,
            resourceTypes,
          } = msg.data.value;

          setResourceDependencyGraphData({
            activeResources,
            deployment,
            dependencyGraph,
            resourceDefinitions,
            resourceTypes,
          });
          break;
        }
      }
    });
  }, []);

  const theme: GraphTheme = {
    color: {
      white: '#FFF',
      black: '#000',
      // Base
      baseDarker: '#101114',
      base: '#17181C',
      baseTransparent: rgba('#242628', 0.5),
      baseBrighter: '#24252B',
      baseBrightest: '#0b0b0f',
      baseOutline: '#414450',
      baseLayer: '#0D0D0D',
      // Main
      mainDarker: '#0049BD',
      main: '#0062FF',
      mainBrighter: '#428BFF',
      mainTransparent: '#428BFF',
      // Text
      text: '#FAFAFA',
      textTranslucent: '#BDBDBD',
      // Other
      categoricalPalette: {
        purple: '#6929c4',
        cyan: '#1192e8',
        teal: '#005d5d',
        magenta: '#9f1853',
        red: '#fa4d56',
      },
    },
  };

  if (!resourceDependencyGraphData) {
    return (
      <div className="App">
        <header className="App-header">
          <VSCodeProgressRing />
          <p>Loading data ...</p>
        </header>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Wrapper>
        <ResourceDependencyGraph
          deployment={resourceDependencyGraphData!.deployment}
          resourceDependencyGraph={resourceDependencyGraphData!.dependencyGraph}
          resourceDefinitions={resourceDependencyGraphData!.resourceDefinitions}
          resourceTypes={resourceDependencyGraphData!.resourceTypes}
          activeResources={resourceDependencyGraphData!.activeResources}
        />
      </Wrapper>
    </ThemeProvider>
  );
}

export default App;
