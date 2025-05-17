let timer = null;
let isPaused = false;
let customerId = 1;
let lastArrivalTime = 0;
let cp = 0;

let customers = [];

function getExponential(mean) {
  const rn = Math.random();
  return { rn, value: -mean * Math.log(rn) };
}

function startSimulation() {
  resetSimulation();
  isPaused = false;
  timer = setInterval(simulateStep, 1000);
}

function pauseSimulation() {
  clearInterval(timer);
  isPaused = true;
}

function resumeSimulation() {
  if (isPaused) {
    timer = setInterval(simulateStep, 1000);
    isPaused = false;
  }
}

function simulateStep() {
  const lambda = parseFloat(document.getElementById('lambda').value);
  const mu = parseFloat(document.getElementById('mu').value);
  const arrivalResult = getExponential(1 / lambda);
  const serviceResult = getExponential(1 / mu);

  if (cp + arrivalResult.rn > 1) {
    pauseSimulation();
    return;
  }

  cp += arrivalResult.rn;

  const interarrivalTime = arrivalResult.value;
  const arrivalTime = lastArrivalTime + interarrivalTime;
  const serviceTime = serviceResult.value;
  const rn1 = arrivalResult.rn.toFixed(4);
  const rn2 = serviceResult.rn.toFixed(4);

  // Calculate start and end time
  const prevEndTime = customers.length > 0 ? customers[customers.length - 1].end : 0;
  const startTime = Math.max(arrivalTime, prevEndTime);
  const endTime = startTime + serviceTime;
  const tat = endTime - arrivalTime;
  const waitTime = startTime - arrivalTime;
  const responseTime = waitTime;

  customers.push({
    id: customerId++,
    rn1,
    interarrival: interarrivalTime.toFixed(2),
    arrival: arrivalTime.toFixed(2),
    rn2,
    service: serviceTime.toFixed(2),
    start: startTime.toFixed(2),
    end: endTime.toFixed(2),
    tat: tat.toFixed(2),
    wait: waitTime.toFixed(2),
    response: responseTime.toFixed(2)
  });

  lastArrivalTime = arrivalTime;
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('customerTableBody');
  tbody.innerHTML = "";
  customers.forEach(c => {
    const row = `
      <tr>
        <td>${c.id}</td>
        <td>${c.rn1}</td>
        <td>${c.interarrival}</td>
        <td>${c.arrival}</td>
        <td>${c.rn2}</td>
        <td>${c.service}</td>
        <td>${c.start}</td>
        <td>${c.end}</td>
        <td>${c.tat}</td>
        <td>${c.wait}</td>
        <td>${c.response}</td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

function resetSimulation() {
  clearInterval(timer);
  customers = [];
  cp = 0;
  customerId = 1;
  lastArrivalTime = 0;
  document.getElementById('customerTableBody').innerHTML = "";
}
