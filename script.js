// script.js
let lambda, mu, servers, modelType;
let customers = [], arrivalTime = 0, id = 1;
let serverEndTimes = [], serverBusyTime = [];
let simulationInterval = null;
let simulationRunning = false;

function getExponential(rate) {
  const rn = Math.random();
  return -1 / rate * Math.log(rn);
}

function getUniform(min, max) {
  return min + Math.random() * (max - min);
}

function getNormal(mean, stdDev) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.max(0, mean + z * stdDev); // clamp to 0 min
}

function simulateStep() {
  const interArrival = getExponential(lambda);
  let service;

  if (modelType === 'MMC') {
    service = getExponential(mu);
  } else if (modelType === 'MGC') {
    service = getUniform(1 / mu, 2 / mu);
  } else if (modelType === 'MNC') {
    const mean = 1 / mu;
    const stdDev = mean * 0.3; // 30% deviation for variety
    service = getNormal(mean, stdDev);
  }

  arrivalTime += interArrival;
  const cp = 1 - Math.exp(-lambda * arrivalTime);

  let earliestServer = 0;
  let earliestAvailable = serverEndTimes[0];
  for (let i = 1; i < servers; i++) {
    if (serverEndTimes[i] < earliestAvailable) {
      earliestAvailable = serverEndTimes[i];
      earliestServer = i;
    }
  }

  const start = Math.max(arrivalTime, serverEndTimes[earliestServer]);
  const end = start + service;
  serverEndTimes[earliestServer] = end;
  serverBusyTime[earliestServer] += service;

  customers.push({
    id,
    arrival: arrivalTime,
    service,
    start,
    end,
    wait: start - arrivalTime,
    turnaround: end - arrivalTime,
    server: earliestServer + 1
  });

  log(`Customer ${id}: Arrived at ${arrivalTime.toFixed(6)} min, Assigned to Server ${earliestServer + 1}, Start: ${start.toFixed(6)}, End: ${end.toFixed(6)}, CP: ${cp.toFixed(6)}`);

  id++;
  updateTable();

  if (cp > 0.999999) {
    stopSimulation();
    document.getElementById('cp-summary').innerText = `Simulation stopped at CP > 0.999999 (Final Arrival ≈ ${arrivalTime.toFixed(6)} min)`;
    displaySummary();
    showClearButton();
  }
}

function updateTable() {
  const tbody = document.getElementById('results-body');
  tbody.innerHTML = '';
  customers.forEach(c => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${c.id}</td>
      <td>${c.arrival.toFixed(6)}</td>
      <td>${c.service.toFixed(6)}</td>
      <td>${c.start.toFixed(6)}</td>
      <td>${c.end.toFixed(6)}</td>
      <td>${c.wait.toFixed(6)}</td>
      <td>${c.turnaround.toFixed(6)}</td>
    `;
    tbody.appendChild(row);
  });
  document.getElementById('results-table').classList.remove('hidden');
}

function displaySummary() {
  const totalTime = Math.max(...serverEndTimes);
  const avgWait = customers.reduce((a, b) => a + b.wait, 0) / customers.length;
  const avgService = customers.reduce((a, b) => a + b.service, 0) / customers.length;
  const avgTAT = customers.reduce((a, b) => a + b.turnaround, 0) / customers.length;

  let utilizationText = '<p><strong>Server Utilization:</strong></p>';
  for (let i = 0; i < servers; i++) {
    const util = (serverBusyTime[i] / totalTime) * 100;
    utilizationText += `<p>Server ${i + 1}: ${util.toFixed(2)}%</p>`;
  }

  document.getElementById('final-stats').innerHTML = `
    <p>Total Simulation Time: ${totalTime.toFixed(6)} minutes</p>
    <p>Total Customers: ${customers.length}</p>
    <p>Average Wait Time: ${avgWait.toFixed(6)} min</p>
    <p>Average Service Time: ${avgService.toFixed(6)} min</p>
    <p>Average Turnaround Time: ${avgTAT.toFixed(6)} min</p>
    ${utilizationText}
  `;
  document.getElementById('summary').classList.remove('hidden');
}

function startSimulation() {
  if (simulationRunning) return;

  lambda = parseFloat(document.getElementById('lambda').value);
  mu = parseFloat(document.getElementById('mu').value);
  servers = parseInt(document.getElementById('servers').value);
  modelType = document.getElementById('model').value;

  if (isNaN(lambda) || isNaN(mu) || isNaN(servers) || lambda <= 0 || mu <= 0 || servers <= 0) {
    alert("Enter valid positive values for λ, μ, and number of servers");
    return;
  }

  if (serverEndTimes.length === 0) {
    serverEndTimes = Array(servers).fill(0);
    serverBusyTime = Array(servers).fill(0);
  }

  simulationRunning = true;
  simulationInterval = setInterval(simulateStep, 300);
}

function pauseSimulation() {
  clearInterval(simulationInterval);
  simulationRunning = false;
}

function stopSimulation() {
  clearInterval(simulationInterval);
  simulationRunning = false;
}

function showClearButton() {
  const btn = document.createElement('button');
  btn.textContent = 'Clear';
  btn.style.marginLeft = '10px';
  btn.style.backgroundColor = '#dc3545';
  btn.style.color = 'white';
  btn.style.border = 'none';
  btn.style.padding = '10px 15px';
  btn.style.borderRadius = '4px';
  btn.onclick = () => location.reload();
  document.querySelector('.buttons').appendChild(btn);
}

function log(message) {
  const logBox = document.getElementById('log');
  logBox.textContent += message + '\n';
  logBox.scrollTop = logBox.scrollHeight;
}

document.getElementById('startBtn').addEventListener('click', startSimulation);
document.getElementById('pauseBtn').addEventListener('click', pauseSimulation);
