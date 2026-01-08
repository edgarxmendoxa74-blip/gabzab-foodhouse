import React, { useState } from 'react'

export default function FullDetailsModal({ painting: item, isOpen, onClose, addToCart }) {
    const [selectedSize, setSelectedSize] = useState('')
    const [selectedFlavor, setSelectedFlavor] = useState('')

    if (!isOpen || !item) return null

    const isWings = item.title.toLowerCase().includes('wings')
    const isSilog = item.category.toLowerCase().includes('silog')
    const isRefreshers = item.category.toLowerCase().includes('refreshers')
    const isPlatter = item.title.toLowerCase().includes('platter')

    const wingsOptions = {
        sizes: [
            { label: '6pc', price: 249 },
            { label: '8pc', price: 299 },
            { label: '10pc', price: 349 }
        ],
        flavors: ['Original', 'Spicy Buffalo']
    }

    const silogOptions = ['Chicken Silog', 'Sisig Silog', 'Bacon Silog', 'Tocino Silog', 'Beef Tapa Silog', 'Siomai Silog']

    const refresherOptions = [
        'Blue Lemonade', 'Cucumber Lemonade', 'Strawberry Red Tea',
        'Orange Refresher', 'Pineapple Refresher', 'Citrus Dew',
        'Blueberry Refresher', '4 Seasons', 'Pine-O'
    ]

    const platterOptions = [
        { label: 'Good for 2', price: 150 },
        { label: 'Good for 3', price: 199 },
        { label: 'Good for 4', price: 249 }
    ]

    const handleAddToCart = () => {
        let finalPrice = item.price
        let customName = item.title

        if (isWings && selectedSize) {
            const sizeOption = wingsOptions.sizes.find(s => s.label === selectedSize)
            finalPrice = sizeOption?.price || item.price
            customName = `${item.title} (${selectedSize} ${selectedFlavor})`
        } else if (isPlatter && selectedSize) {
            const sizeOption = platterOptions.find(s => s.label === selectedSize)
            finalPrice = sizeOption?.price || item.price
            customName = `${item.title} (${selectedSize})`
        } else if (isRefreshers && selectedFlavor) {
            customName = `${selectedFlavor} (${item.title})`
        }

        const customizedItem = {
            ...item,
            id: `${item.id}-${selectedSize || ''}-${selectedFlavor || ''}-${Date.now()}`,
            customTitle: customName.trim(),
            price: finalPrice
        }
        addToCart(customizedItem)
        onClose()
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--c-slate)', border: '1px solid var(--border-light)' }}>
                <button className="modal-close" onClick={onClose} style={{ color: 'var(--c-gold)' }}>&times;</button>

                <div className="modal-body">
                    <div className="modal-image-container">
                        <img src={item.image} alt={item.title} className="modal-image" />
                    </div>

                    <div className="modal-details" style={{ color: 'white' }}>
                        <h2 className="logo-branding" style={{ color: 'var(--c-gold)', fontSize: '2rem' }}>{item.title}</h2>

                        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{item.description}</p>

                        {/* Wings Customization */}
                        {isWings && (
                            <>
                                <div className="modal-section">
                                    <p className="modal-label">Select Size</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {wingsOptions.sizes.map(s => (
                                            <button
                                                key={s.label}
                                                className={`category-btn ${selectedSize === s.label ? 'active' : ''}`}
                                                onClick={() => setSelectedSize(s.label)}
                                            >
                                                {s.label} (₱{s.price})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-section">
                                    <p className="modal-label">Select Flavor</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {wingsOptions.flavors.map(f => (
                                            <button
                                                key={f}
                                                className={`category-btn ${selectedFlavor === f ? 'active' : ''}`}
                                                onClick={() => setSelectedFlavor(f)}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Platter Customization */}
                        {isPlatter && (
                            <div className="modal-section">
                                <p className="modal-label">Select Platter Size</p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {platterOptions.map(s => (
                                        <button
                                            key={s.label}
                                            className={`category-btn ${selectedSize === s.label ? 'active' : ''}`}
                                            onClick={() => setSelectedSize(s.label)}
                                        >
                                            {s.label} (₱{s.price})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Refresher Variations */}
                        {isRefreshers && (
                            <div className="modal-section">
                                <p className="modal-label">Select Flavor</p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {refresherOptions.map(f => (
                                        <button
                                            key={f}
                                            className={`category-btn ${selectedFlavor === f ? 'active' : ''}`}
                                            onClick={() => setSelectedFlavor(f)}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Refreshers Promo Hint */}
                        {isRefreshers && (
                            <div className="modal-section" style={{ background: 'rgba(249, 212, 35, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--c-gold)' }}>
                                <p style={{ color: 'var(--c-gold)', fontWeight: '600', marginBottom: '0.2rem' }}>💰 PROMO ALERT!</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Get ₱5 off total if you buy 2 or more refreshers!</p>
                            </div>
                        )}

                        {/* Price Display for simple items */}
                        {!isWings && !isPlatter && (
                            <div className="modal-section">
                                <p className="modal-label">Price</p>
                                <p style={{ color: 'var(--c-gold)', fontSize: '1.5rem', fontWeight: '700' }}>₱{Number(item.price).toLocaleString()}</p>
                            </div>
                        )}

                        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                            <button
                                className="btn-primary"
                                style={{ width: '100%' }}
                                onClick={handleAddToCart}
                                disabled={(isWings && (!selectedSize || !selectedFlavor)) || (isPlatter && !selectedSize) || (isRefreshers && !selectedFlavor)}
                            >
                                Add to Order
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
