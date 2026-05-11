import { useState } from 'react'

const initialProfile = {
  fullName: 'Shardul Anagal',
  email: 'shardul@example.com',
  roleFocus: 'Student',
  mainGoal: 'Complete COMPSCI 732 Project',
}

const initialPreferences = {
  preferredStartTime: '09:00',
  preferredEndTime: '17:00',
  workloadCapacity: 'Balanced',
  focusStyle: 'Deep Work',
  breakPreference: '15 minutes',
  motivationStyle: 'Encouraging',
  priorityPreference: 'Balanced',
  scheduleStyle: 'Flexible blocks',
}

function Profile({ goals, tasks, totalXP, levelInfo }) {
  const [savedProfile, setSavedProfile] = useState(initialProfile)
  const [profileForm, setProfileForm] = useState(initialProfile)
  const [preferences, setPreferences] = useState(initialPreferences)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const activeGoals = Math.max(3, goals.length)
  const activeTasks = Math.max(
    5,
    tasks.filter((task) => task.status !== 'Completed').length,
  )

  function handleProfileChange(event) {
    const { name, value } = event.target

    setProfileForm((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }))
  }

  function handlePreferenceChange(event) {
    const { name, value } = event.target

    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [name]: value,
    }))
  }

  function getInitials(name) {
    const nameParts = name.trim().split(' ').filter(Boolean)

    if (nameParts.length === 0) {
      return 'SA'
    }

    return nameParts
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('')
  }

  function handleAvatarChange(event) {
    const file = event.target.files[0]

    if (!file) {
      return
    }

    setAvatarPreview(URL.createObjectURL(file))
    setSuccessMessage('')
    setErrorMessage('')
  }

  function handleRemovePhoto() {
    setAvatarPreview('')
  }

  function validateProfile() {
    if (!profileForm.fullName.trim()) {
      return 'Full name cannot be empty.'
    }

    if (!profileForm.email.trim()) {
      return 'Email cannot be empty.'
    }

    if (!profileForm.email.includes('@')) {
      return 'Please enter a valid email address.'
    }

    return ''
  }

  function handleSave(event) {
    event.preventDefault()

    const validationError = validateProfile()

    if (validationError) {
      setErrorMessage(validationError)
      setSuccessMessage('')
      return
    }

    setSavedProfile({
      fullName: profileForm.fullName.trim(),
      email: profileForm.email.trim(),
      roleFocus: profileForm.roleFocus.trim(),
      mainGoal: profileForm.mainGoal.trim(),
    })
    setErrorMessage('')
    setSuccessMessage('Profile and preferences saved successfully.')
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <h2 className="text-3xl font-bold text-white">Profile & Preferences</h2>
        <p className="mt-2 text-slate-300">
          Personalise how TASKFLOW AI plans your day.
        </p>
      </section>

      {successMessage && (
        <section className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-100">
          {successMessage}
        </section>
      )}

      {errorMessage && (
        <section className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-200">
          {errorMessage}
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <form onSubmit={handleSave} className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-white">
                Profile Information
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Keep your account details clear for the prototype.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Full name
                </span>
                <input
                  type="text"
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={handleProfileChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Email
                </span>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Role/Focus
                </span>
                <input
                  type="text"
                  name="roleFocus"
                  value={profileForm.roleFocus}
                  onChange={handleProfileChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Main goal
                </span>
                <input
                  type="text"
                  name="mainGoal"
                  value={profileForm.mainGoal}
                  onChange={handleProfileChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-white">
                Planning Preferences
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Set the default shape of your study and work day.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Preferred start time
                </span>
                <input
                  type="time"
                  name="preferredStartTime"
                  value={preferences.preferredStartTime}
                  onChange={handlePreferenceChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Preferred end time
                </span>
                <input
                  type="time"
                  name="preferredEndTime"
                  value={preferences.preferredEndTime}
                  onChange={handlePreferenceChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Daily workload capacity
                </span>
                <select
                  name="workloadCapacity"
                  value={preferences.workloadCapacity}
                  onChange={handlePreferenceChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option>Light</option>
                  <option>Balanced</option>
                  <option>Intensive</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Preferred focus style
                </span>
                <select
                  name="focusStyle"
                  value={preferences.focusStyle}
                  onChange={handlePreferenceChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option>Deep Work</option>
                  <option>Short Focus Blocks</option>
                  <option>Flexible</option>
                </select>
              </label>

              <label className="block lg:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Break preference
                </span>
                <select
                  name="breakPreference"
                  value={preferences.breakPreference}
                  onChange={handlePreferenceChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option>5 minutes</option>
                  <option>10 minutes</option>
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-white">Personalisation</h3>
              <p className="mt-1 text-sm text-slate-300">
                Tune how TASKFLOW AI presents plans and priorities.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Motivation style
                </span>
                <select
                  name="motivationStyle"
                  value={preferences.motivationStyle}
                  onChange={handlePreferenceChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option>Encouraging</option>
                  <option>Direct</option>
                  <option>Detailed</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Priority preference
                </span>
                <select
                  name="priorityPreference"
                  value={preferences.priorityPreference}
                  onChange={handlePreferenceChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option>Deadline first</option>
                  <option>High priority first</option>
                  <option>Balanced</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Schedule style
                </span>
                <select
                  name="scheduleStyle"
                  value={preferences.scheduleStyle}
                  onChange={handlePreferenceChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option>Strict time blocking</option>
                  <option>Flexible blocks</option>
                  <option>Minimal schedule</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              className="mt-5 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Save Preferences
            </button>
          </section>
        </form>

        <aside className="h-fit rounded-3xl border border-white/10 bg-white/10 p-6 text-center shadow-lg shadow-blue-950/20 xl:sticky xl:top-6">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Profile preview"
              className="mx-auto h-24 w-24 rounded-full border-4 border-blue-400/40 object-cover shadow-lg shadow-blue-500/30"
            />
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white shadow-lg shadow-blue-500/30">
              {getInitials(savedProfile.fullName)}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3">
            <label className="cursor-pointer rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400">
              Upload Profile Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="rounded-2xl border border-blue-300/30 px-5 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20"
              >
                Remove Photo
              </button>
            )}
          </div>

          <h3 className="mt-5 text-xl font-bold text-white">
            {savedProfile.fullName}
          </h3>
          <p className="mt-1 text-sm text-slate-300">{savedProfile.roleFocus}</p>
          <p className="mt-1 text-sm font-semibold text-blue-200">
            {levelInfo.currentLevelLabel}
          </p>

          <div className="mt-6 grid gap-3 text-left">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">XP</p>
              <p className="mt-1 text-lg font-bold text-white">{totalXP} XP</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">Streak</p>
              <p className="mt-1 text-lg font-bold text-white">4 day streak</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">Active goals</p>
              <p className="mt-1 text-lg font-bold text-white">
                {activeGoals} active goals
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">Active tasks</p>
              <p className="mt-1 text-lg font-bold text-white">
                {activeTasks} active tasks
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Profile
