export default function FiveDay({ daily, units = 'metric', loading = false, error }) {
  const hasDays = Array.isArray(daily) && daily.length > 0;
  const sym = units === 'imperial' ? '\u00B0F' : '\u00B0C';

  let statusMessage = null;
  let statusClass = 'forecast__status';

  if (loading) {
    statusMessage = 'Loading forecast...';
  } else if (error) {
    statusMessage = `Error: ${error}`;
    statusClass += ' forecast__status--error';
  } else if (!hasDays) {
    statusMessage = 'No forecast data available yet.';
  }

  return (
    <section className="forecast" aria-live="polite">
      <div className="forecast__header">
        <h2 style={{ color: '#ffffff' }}>Five day forecast</h2>
        {statusMessage && <p className={statusClass}>{statusMessage}</p>}
      </div>

      {hasDays && (
        <div className="forecast__grid">
          {daily.map((day) => {
            const key = day.date || day.dt;
            const hasTimestamp = typeof day.dt === 'number';
            const dateObj = hasTimestamp ? new Date(day.dt * 1000) : (day.date ? new Date(day.date) : null);
            const label = dateObj
              ? dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
              : day.date || 'Day';
            const rain = Math.round((day.pop || 0) * 100);

            return (
              <article key={key} className="forecast-card">
                <p className="forecast-card__day">{label}</p>
                {day.icon && (
                  <img
                    className="forecast-card__icon"
                    alt={day.description || 'Weather icon'}
                    src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                  />
                )}
                <p className="forecast-card__temps">
                  {Math.round(day.temp.max)}
                  {sym} / {Math.round(day.temp.min)}
                  {sym}
                </p>
                <p className="forecast-card__description">
                  {day.description || 'No description'}
                </p>
                <p className="forecast-card__rain">Rain chance {rain}%</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
