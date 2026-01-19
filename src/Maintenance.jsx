import React from 'react'
import logo from './assets/gabzab_logo.jpg'

const Maintenance = () => {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0c',
            color: 'var(--c-gold)',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <img
                src={logo}
                alt="The Midnight Canteen Logo"
                style={{
                    height: '120px',
                    width: '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--c-gold)',
                    marginBottom: '2rem'
                }}
            />
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>We Are Currently Closed</h1>
            <p style={{ color: 'var(--text-light)', fontSize: '1.2rem', maxWidth: '600px' }}>
                We are taking a short break. See you soon at Gabzab Food House!
            </p>
        </div>
    )
}

export default Maintenance
