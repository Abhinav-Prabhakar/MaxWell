'use client'

import { useState } from 'react'
import SpineStepper, { type SpineStepInput } from './components/SpineStepper/SpineStepper'
import { Intake } from './components/Intake/Intake'
import { Symptoms } from './components/Symptoms/Symptoms'
import { Vitals } from './components/Vitals/Vitals'
import { History } from './components/History/History'
import { Medicines } from './components/Medicines/Medicines'
import { Care } from './components/Care/Care'
import { SecondRead } from './components/Read/SecondRead'
import { readInputOf } from './components/Read/types'
import { Handoff } from './components/Handoff/Handoff'
import { EMPTY_ANSWERS, progressOf as intakeProgress, type IntakeAnswers } from './components/Intake/types'
import { EMPTY_SYMPTOMS, isEmergency, progressOf as symptomProgress, type SymptomAnswers } from './components/Symptoms/types'
import { EMPTY_VITALS, isCritical, progressOf as vitalProgress, type VitalsAnswers } from './components/Vitals/types'
import { EMPTY_HISTORY, progressOf as historyProgress, type HistoryAnswers } from './components/History/types'
import { EMPTY_MEDICINES, progressOf as medicineProgress, type MedicinesAnswers } from './components/Medicines/types'
import { EMPTY_CARE, progressOf as careProgress, type CareAnswers } from './components/Care/types'
import { centerOf } from './components/Medicines/facilities'

const INITIAL_STEPS: SpineStepInput[] = [
  { id: 'C1', title: 'Basic details', state: 'active', progress: 0 },
  { id: 'C2', title: 'Symptoms', state: 'pending' },
  { id: 'C3', title: 'Vitals', state: 'pending' },
  { id: 'C4', title: 'History', state: 'pending' },
  { id: 'C5', title: 'Medicines', state: 'pending' },
  { id: 'C6', title: 'Care plan', state: 'pending' },
  { id: 'C7', title: 'Second read', state: 'pending' },
  { id: 'C8', title: 'Handoff', state: 'pending' },
]


type Station = 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8'

export default function App() {
  const [steps, setSteps] = useState<SpineStepInput[]>(INITIAL_STEPS)
  const [intake, setIntake] = useState<IntakeAnswers>(EMPTY_ANSWERS)
  const [symptoms, setSymptoms] = useState<SymptomAnswers>(EMPTY_SYMPTOMS)
  const [vitals, setVitals] = useState<VitalsAnswers>(EMPTY_VITALS)
  const [history, setHistory] = useState<HistoryAnswers>(EMPTY_HISTORY)
  const [medicines, setMedicines] = useState<MedicinesAnswers>(EMPTY_MEDICINES)
  const [care, setCare] = useState<CareAnswers>(EMPTY_CARE)
  const [station, setStation] = useState<Station>('c1')
  const [c1Filed, setC1Filed] = useState(false)
  const [c2Filed, setC2Filed] = useState(false)
  const [c3Filed, setC3Filed] = useState(false)
  const [c4Filed, setC4Filed] = useState(false)
  const [c5Filed, setC5Filed] = useState(false)
  const [c6Filed, setC6Filed] = useState(false)
  const [c7Filed, setC7Filed] = useState(false)
  const [c8Filed, setC8Filed] = useState(false)

  /* A quiet scaffold for checking the rail at any length; not part of the intake.
     The intake mounts on the client only, so reading the query here is safe. */
  const [demo] = useState(() => new URLSearchParams(window.location.search).has('demo'))

  const c1 = intakeProgress(intake)
  const c2 = symptomProgress(symptoms)
  const c3 = vitalProgress(vitals)
  const c4 = historyProgress(history)
  const c5 = medicineProgress(medicines)
  const c6 = careProgress(care)

  const c2Urgent = isEmergency(symptoms)
  const c3Urgent = isCritical(vitals)

  /* The rail follows the questionnaire, not the other way round: the active node
     is the station being worked on, and its bar is that station's own progress.
     An emergency never walks on: red flags stop at C2, critical vitals at C3. */
  const activeIndex =
    station === 'c1'
      ? c1Filed
        ? 1
        : 0
      : station === 'c2'
        ? c2Filed && !c2Urgent
          ? 2
          : 1
        : station === 'c3'
          ? c3Filed && !c3Urgent
            ? 3
            : 2
          : station === 'c4'
            ? c4Filed
              ? 4
              : 3
            : station === 'c5'
              ? c5Filed
                ? 5
                : 4
              : station === 'c6'
                ? c6Filed
                  ? 6
                  : 5
                : station === 'c7'
                  ? c7Filed
                    ? 7
                    : 6
                  : c8Filed
                    ? 8
                    : 7

  const rail = steps.map((step, i) => {
    const state: SpineStepInput['state'] =
      i < activeIndex ? 'complete' : i === activeIndex ? 'active' : 'pending'
    const progress =
      i === 0
        ? c1Filed
          ? 1
          : c1.ratio
        : i === 1
          ? c2Filed
            ? 1
            : station === 'c2'
              ? c2.ratio
              : 0
          : i === 2
            ? c3Filed
              ? 1
              : station === 'c3'
                ? c3.ratio
                : 0
            : i === 3
              ? c4Filed
                ? 1
                : station === 'c4'
                  ? c4.ratio
                  : 0
              : i === 4
                ? c5Filed
                  ? 1
                  : station === 'c5'
                    ? c5.ratio
                    : 0
                : i === 5
                  ? c6Filed
                    ? 1
                    : station === 'c6'
                      ? c6.ratio
                      : 0
                  : i === 6
                    ? c7Filed
                      ? 1
                      : 0
                    : i === 7
                      ? c8Filed
                        ? 1
                        : 0
                      : undefined
    return { ...step, state, progress }
  })

  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      { id: `C${prev.length + 1}`, title: `Checkpoint ${prev.length + 1}`, state: 'pending' },
    ])

  const removeStep = () => setSteps((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))

  const reset = () => {
    setSteps(INITIAL_STEPS)
    setIntake(EMPTY_ANSWERS)
    setSymptoms(EMPTY_SYMPTOMS)
    setVitals(EMPTY_VITALS)
    setHistory(EMPTY_HISTORY)
    setMedicines(EMPTY_MEDICINES)
    setCare(EMPTY_CARE)
    setStation('c1')
    setC1Filed(false)
    setC2Filed(false)
    setC3Filed(false)
    setC4Filed(false)
    setC5Filed(false)
    setC6Filed(false)
    setC7Filed(false)
    setC8Filed(false)
  }

  return (
    <main className="shell">
      <div className="shell__rail">
        <SpineStepper steps={rail} showHeader={false} />
      </div>

      <section className="shell__workspace">
        <div className="station" key={station}>
          {station === 'c1' ? (
            <Intake
              answers={intake}
              onChange={setIntake}
              onFinish={() => setC1Filed(true)}
              onReopen={() => setC1Filed(false)}
              onNext={() => setStation('c2')}
            />
          ) : station === 'c2' ? (
            <Symptoms
              answers={symptoms}
              onChange={setSymptoms}
              location={intake.location}
              onFiled={() => setC2Filed(true)}
              onReopen={() => setC2Filed(false)}
              onNext={() => setStation('c3')}
            />
          ) : station === 'c3' ? (
            <Vitals
              answers={vitals}
              onChange={setVitals}
              location={intake.location}
              onFiled={() => setC3Filed(true)}
              onReopen={() => setC3Filed(false)}
              onNext={() => setStation('c4')}
            />
          ) : station === 'c4' ? (
            <History
              answers={history}
              onChange={setHistory}
              onFiled={() => setC4Filed(true)}
              onReopen={() => setC4Filed(false)}
              onNext={() => setStation('c5')}
            />
          ) : station === 'c5' ? (
            <Medicines
              answers={medicines}
              onChange={setMedicines}
              location={intake.location}
              file={{ age: intake.age, pregnant: intake.pregnant, symptoms, vitals, history }}
              onFiled={() => setC5Filed(true)}
              onReopen={() => setC5Filed(false)}
              onNext={() => setStation('c6')}
            />
          ) : station === 'c6' ? (
            <Care
              answers={care}
              onChange={setCare}
              location={intake.location}
              medicines={medicines}
              file={{ age: intake.age, pregnant: intake.pregnant, symptoms, vitals, history }}
              onFiled={() => setC6Filed(true)}
              onReopen={() => setC6Filed(false)}
              onNext={() => setStation('c7')}
            />
          ) : station === 'c7' ? (
            <SecondRead
              input={readInputOf(
                {
                  intake,
                  symptoms,
                  vitals,
                  history,
                  file: { age: intake.age, pregnant: intake.pregnant, symptoms, vitals, history },
                },
                centerOf(intake.location).place,
              )}
              onRead={() => setC7Filed(true)}
              onNext={() => setStation('c8')}
            />
          ) : (
            <Handoff
              record={{
                intake,
                symptoms,
                vitals,
                history,
                medicines,
                care,
                file: { age: intake.age, pregnant: intake.pregnant, symptoms, vitals, history },
              }}
              onFiled={() => setC8Filed(true)}
              onRestart={reset}
            />
          )}
        </div>
      </section>

      {demo && (
        <div className="demo">
          <button type="button" onClick={removeStep} aria-label="Remove checkpoint">
            −
          </button>
          <span>{steps.length}</span>
          <button type="button" onClick={addStep} aria-label="Add checkpoint">
            +
          </button>
          <button type="button" onClick={reset}>
            Reset
          </button>
        </div>
      )}
    </main>
  )
}
