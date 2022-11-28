'use strict';

// Elements
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//// Creating Workout ////
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(distance, duration, coords) {
    this.distance = distance; // in km
    this.duration = duration; // in min
    this.coords = coords; // [lng, lat]
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'Jun', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.type = 'running';
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.type = 'cycling';
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running(5, 120, [39, 32], 50);
const cycling1 = new Cycling(50, 600, [39, 32], 90);
console.log(run1, cycling1);

//// APP ////

class App {
  #map;
  #mapEvent;
  #workout = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggelElevationField);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('error');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('none');
    inputDistance.focus();
  }

  _hideForm() {
    form.classList.add('none');
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
  }

  _toggelElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    // TODO
    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if workout running create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('inputs have to be positive numbers');

      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    // if workout cycling create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('inputs have to be positive numbers');

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }

    // add new object to workout array
    this.#workout.push(workout);
    console.log(workout);

    // render workout on map as marker
    this._renderWorkoutMarker(workout);

    // render workout on list
    this._renderWorkout(workout);

    // hide form + clear inputs
    this._hideForm();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${
        workout.type
      } card flex flex-column gap-l justify-center" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__detail flex gap-l justify-between">
          <div class="workout__detail--item flex gap-xs align-items-baseline">
            <span class="workout__detail--item-icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__detail--item-value">${workout.distance}</span>
            <span class="workout__detail--item-unit">km</span>
          </div>
          <div class="workout__detail--item flex gap-xs align-items-baseline">
            <span class="workout__detail--item-icon">⏱</span>
            <span class="workout__detail--item-value">${workout.distance}</span>
            <span class="workout__detail--item-unit">min</span>
          </div>
    `;

    if (workout.type === 'running') {
      html += `
            <div class="workout__detail--item flex gap-xs align-items-baseline">
              <span class="workout__detail--item-icon">⚡️</span>
              <span class="workout__detail--item-value">${workout.pace.toFixed(
                1
              )}</span>
              <span class="workout__detail--item-unit">min/km</span>
            </div>
            <div class="workout__detail--item flex gap-xs align-items-baseline">
              <span class="workout__detail--item-icon">👟</span>
              <span class="workout__detail--item-value">${
                workout.cadence
              }</span>
              <span class="workout__detail--item-unit">spm</span>
            </div>
          </div>
        </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
            <div class="workout__detail--item flex gap-xs align-items-baseline">
              <span class="workout__detail--item-icon">⚡️</span>
              <span class="workout__detail--item-value">${workout.speed.toFixed(
                1
              )}</span>
              <span class="workout__detail--item-unit">km/h</span>
            </div>
            <div class="workout__detail--item flex gap-xs align-items-baseline">
              <span class="workout__detail--item-icon">⛰</span>
              <span class="workout__detail--item-value">${
                workout.elevationGain
              }</span>
              <span class="workout__detail--item-unit">m</span>
            </div>
          </div>
        </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }
}

const app = new App();
