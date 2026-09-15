import { useNavigate } from 'react-router-dom'
import { useSyntheticStore } from '../context/useSyntheticStore'
import Heading from '../components/ui/Heading'

export default function SettingsView() {
  const navigate = useNavigate()
  const { notify } = useSyntheticStore()

  return (
    <>
      <div style={{ marginBottom: '10px' }}>
        <button
          type="button"
          className="ghost"
          onClick={() => navigate('/more')}
          style={{ paddingLeft: 0 }}
        >
          ← Back to More
        </button>
      </div>

      <Heading
        eyebrow="Workspace"
        title="Business settings"
        text="Configure your company identity and production defaults."
      />

      <section className="panel settings-grid">
        <div>
          <h3>Business profile</h3>
          <label>
            Company name
            <input defaultValue="Live Laugh Love Print" />
          </label>
          <label>
            Registration number
            <input defaultValue="202601012345" />
          </label>
          <label>
            Currency
            <select defaultValue="MYR">
              <option>MYR — Malaysian Ringgit</option>
            </select>
          </label>
        </div>
        <div>
          <h3>Document defaults</h3>
          <label>
            Invoice prefix
            <input defaultValue="INV" />
          </label>
          <label>
            Default tax rate
            <input defaultValue="0" type="number" />
          </label>
          <label>
            Payment terms
            <select defaultValue="Due on receipt">
              <option>Due on receipt</option>
              <option>7 days</option>
              <option>30 days</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          className="primary"
          onClick={() => notify('Business settings saved in demo')}
        >
          Save settings
        </button>
      </section>
    </>
  )
}
