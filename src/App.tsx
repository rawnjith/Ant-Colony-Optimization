import React, { useState, useEffect } from 'react';
import { Bug, Settings, Play, RefreshCw, Table, Info } from 'lucide-react';

interface City {
  x: number;
  y: number;
  name: string;
}

function App() {
  const [cities, setCities] = useState<City[]>([]);
  const [numCities, setNumCities] = useState<number>(3);
  const [progress, setProgress] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [bestPath, setBestPath] = useState<number[]>([]);
  const [bestDistance, setBestDistance] = useState<number>(0);
  const [distanceMatrix, setDistanceMatrix] = useState<number[][]>([]);
  const [showMatrix, setShowMatrix] = useState<boolean>(true);
  const [iterations, setIterations] = useState<number>(100);
  const [numAnts, setNumAnts] = useState<number>(20);
  const [pathHistory, setPathHistory] = useState<{ distance: number, iteration: number }[]>([]);

  useEffect(() => {
    initializeCities();
  }, [numCities]);

  const initializeCities = () => {
    const newCities: City[] = [];
    const newMatrix: number[][] = Array(numCities).fill(0).map(() => Array(numCities).fill(0));
    
    // Generate cities with names (A, B, C, etc.)
    for (let i = 0; i < numCities; i++) {
      newCities.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        name: String.fromCharCode(65 + i)
      });
    }

    // Initialize distance matrix with random values
    for (let i = 0; i < numCities; i++) {
      for (let j = i + 1; j < numCities; j++) {
        const distance = Math.floor(Math.random() * 100) + 1;
        newMatrix[i][j] = distance;
        newMatrix[j][i] = distance;
      }
    }

    setCities(newCities);
    setDistanceMatrix(newMatrix);
    setBestPath([]);
    setBestDistance(0);
    setPathHistory([]);
  };

  const updateDistanceMatrix = (i: number, j: number, value: number) => {
    const newMatrix = distanceMatrix.map(row => [...row]);
    newMatrix[i][j] = value;
    newMatrix[j][i] = value;
    setDistanceMatrix(newMatrix);
  };

  const calculatePathDistance = (path: number[]) => {
    let distance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      distance += distanceMatrix[path[i]][path[i + 1]];
    }
    return distance;
  };

  const runAntColonyOptimization = async () => {
    setIsRunning(true);
    setProgress(0);
    setPathHistory([]);
    
    const pheromoneMatrix = Array(numCities).fill(0).map(() => Array(numCities).fill(1));
    const evaporationRate = 0.1;
    const alpha = 1; // pheromone importance
    const beta = 2;  // distance importance
    
    let currentBestPath: number[] = [];
    let currentBestDistance = Infinity;

    for (let iter = 0; iter < iterations; iter++) {
      // For each ant
      for (let ant = 0; ant < numAnts; ant++) {
        const path = [];
        const visited = new Set();
        let current = Math.floor(Math.random() * numCities);
        path.push(current);
        visited.add(current);

        // Construct solution
        while (path.length < numCities) {
          const probabilities = [];
          let totalProbability = 0;

          // Calculate probabilities for each unvisited city
          for (let next = 0; next < numCities; next++) {
            if (!visited.has(next)) {
              const pheromone = Math.pow(pheromoneMatrix[current][next], alpha);
              const distance = Math.pow(1 / distanceMatrix[current][next], beta);
              const probability = pheromone * distance;
              probabilities.push({ city: next, probability });
              totalProbability += probability;
            }
          }

          // Select next city using roulette wheel selection
          let random = Math.random() * totalProbability;
          let selectedCity = probabilities[0].city;
          for (const { city, probability } of probabilities) {
            random -= probability;
            if (random <= 0) {
              selectedCity = city;
              break;
            }
          }

          path.push(selectedCity);
          visited.add(selectedCity);
          current = selectedCity;
        }
        path.push(path[0]); // Return to start

        const distance = calculatePathDistance(path);
        if (distance < currentBestDistance) {
          currentBestDistance = distance;
          currentBestPath = [...path];
          setBestPath(currentBestPath);
          setBestDistance(currentBestDistance);
          setPathHistory(prev => [...prev, { distance, iteration: iter }]);
        }

        // Update pheromones
        const pheromoneDeposit = 1 / distance;
        for (let i = 0; i < path.length - 1; i++) {
          pheromoneMatrix[path[i]][path[i + 1]] += pheromoneDeposit;
          pheromoneMatrix[path[i + 1]][path[i]] += pheromoneDeposit;
        }
      }

      // Evaporate pheromones
      for (let i = 0; i < numCities; i++) {
        for (let j = 0; j < numCities; j++) {
          pheromoneMatrix[i][j] *= (1 - evaporationRate);
        }
      }

      setProgress((iter + 1) / iterations * 100);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <Bug className="inline-block mr-2 mb-1" />
            Ant Colony Optimization
          </h1>
          <p className="text-purple-200">
            Developed by Ranjith Raj (rawnjith@gmail.com)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Cities
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={numCities}
                onChange={(e) => setNumCities(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Iterations
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                <Table className="mr-2" size={20} />
                Distance Matrix
              </h3>
              <button
                onClick={() => setShowMatrix(!showMatrix)}
                className="text-purple-600 hover:text-purple-700"
              >
                {showMatrix ? 'Hide' : 'Show'} Matrix
              </button>
            </div>
            {showMatrix && (
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded-lg">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-50"></th>
                      {cities.map((city) => (
                        <th key={city.name} className="border p-2 bg-gray-50">
                          {city.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cities.map((city, i) => (
                      <tr key={city.name}>
                        <th className="border p-2 bg-gray-50">{city.name}</th>
                        {cities.map((_, j) => (
                          <td key={j} className="border p-2">
                            {i === j ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <input
                                type="number"
                                min="1"
                                value={distanceMatrix[i][j]}
                                onChange={(e) => updateDistanceMatrix(i, j, Number(e.target.value))}
                                className="w-20 px-2 py-1 border rounded text-center"
                                disabled={isRunning}
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 mb-6">
            <button
              onClick={initializeCities}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
              disabled={isRunning}
            >
              <RefreshCw className="mr-2" size={20} />
              Reset
            </button>
            <button
              onClick={runAntColonyOptimization}
              disabled={isRunning}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
            >
              {isRunning ? (
                <Settings className="animate-spin mr-2" size={20} />
              ) : (
                <Play className="mr-2" size={20} />
              )}
              {isRunning ? 'Running...' : 'Start Optimization'}
            </button>
          </div>

          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {bestPath.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                <Info className="mr-2" size={20} />
                Results
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">
                    <strong>Best Path:</strong>{' '}
                    {bestPath.map(i => cities[i].name).join(' → ')}
                  </p>
                  <p className="text-gray-600">
                    <strong>Total Distance:</strong> {bestDistance.toFixed(2)} units
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">
                    <strong>Iterations:</strong> {iterations}
                  </p>
                  <p className="text-gray-600">
                    <strong>Number of Ants:</strong> {numAnts}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="relative border rounded-lg p-4 bg-gray-50">
            <svg width="800" height="400" className="mx-auto">
              {cities.map((city, i) => (
                <g key={i}>
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r="4"
                    fill="#4C1D95"
                  />
                  <text
                    x={city.x + 10}
                    y={city.y}
                    className="text-sm"
                    fill="#4C1D95"
                  >
                    {city.name}
                  </text>
                </g>
              ))}
              {bestPath.length > 0 && cities.length > 0 && bestPath.slice(0, -1).map((cityIndex, i) => {
                const nextCityIndex = bestPath[i + 1];
                return (
                  <line
                    key={i}
                    x1={cities[cityIndex].x}
                    y1={cities[cityIndex].y}
                    x2={cities[nextCityIndex].x}
                    y2={cities[nextCityIndex].y}
                    stroke="#6D28D9"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>

          {pathHistory.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Optimization Progress</h3>
              <div className="h-40 border rounded-lg p-4 bg-gray-50">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    d={`M ${pathHistory.map((p, i) => 
                      `${(i / (pathHistory.length - 1)) * 100},${
                        100 - ((p.distance / pathHistory[0].distance) * 90)
                      }`
                    ).join(' L ')}`}
                    fill="none"
                    stroke="#6D28D9"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;