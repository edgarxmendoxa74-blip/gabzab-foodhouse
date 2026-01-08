import React, { useState } from 'react'

export default function FullDetailsModal({ painting: item, isOpen, onClose, addToCart }) {

    const [selectedSize, setSelectedSize] = useState('')
    const [selectedFlavor, setSelectedFlavor] = useState('')
    const [selectedAddOns, setSelectedAddOns] = useState([])
    const [sugarLevel, setSugarLevel] = useState('100%')
    const [isCheesecakeWall, setIsCheesecakeWall] = useState(false)
    const [quantity, setQuantity] = useState(1)

    if (!isOpen || !item) return null

    const isWings = item.title.toLowerCase().includes('wings')
    const isSilog = item.category.toLowerCase().includes('silog')
    const isRefreshers = item.category.toLowerCase().includes('refreshers')
    const isPlatter = item.title.toLowerCase().includes('platter')
    const isBuldak = item.title.toLowerCase().includes('buldak') || item.category === 'Noodles'
    const isMilktea = item.category === 'Classic Milktea Series'
    const isFruitTea = item.category === 'Fruit Tea Series'

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

    const buldakOptions = {
        flavors: ['Orange Buldak Quatro Cheese', 'Pink Buldak Carbonara'],
        addOns: [
            { label: 'Spam', price: 10 },
            { label: 'Egg', price: 15 },
            { label: 'Korean Fishcake', price: 15 },
            { label: 'Nori Seaweed', price: 20 },
            { label: 'Melted Cheese', price: 30 }
        ]
    }

    const milkteaOptions = {
        flavors: ['Cookies Overload', 'Dark Chocolate', 'Red Velvet', 'Cheesecake', 'Wintermelon', 'Taro', 'Matcha', 'Okinawa', 'Candy Rabbit'],
        sizes: [
            { label: 'Medium', price: 79 },
            { label: 'Large', price: 89 }
        ],
        addOns: [
            { label: 'Extra Pearl', price: 10 },
            { label: 'Crushed Oreo', price: 10 },
            { label: 'Nata de Coco', price: 10 },
            { label: 'Coffee Jelly', price: 15 }
        ],
        sugar: ['0%', '25%', '50%', '75%', '100%', '125%']
    }

    const fruitTeaOptions = {
        flavors: ['Mango', 'Green Apple', 'Blueberry', 'Lychee'],
        sizes: [
            { label: 'Medium', price: 75 },
            { label: 'Large', price: 85 }
        ],
        addOns: [
            { label: 'Extra Nata', price: 10 },
            { label: 'Black Pearl', price: 10 },
            { label: 'Coffee Jelly', price: 15 }
        ]
    }

    const handleAddToCart = () => {
        let finalPrice = item.price
        let customName = item.title
        let addOnsText = ''

        if (selectedAddOns.length > 0) {
            const addOnsTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0)
            finalPrice += addOnsTotal
            addOnsText = ` + ${selectedAddOns.map(a => a.label).join(', ')}`
        }

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
        } else if (isBuldak) {
            // Base price is 149
            finalPrice = 149 + (selectedAddOns.reduce((sum, a) => sum + a.price, 0))
            customName = `${selectedFlavor} (${item.title})${addOnsText}`
        } else if (isMilktea && selectedSize && selectedFlavor) {
            const sizeOption = milkteaOptions.sizes.find(s => s.label === selectedSize)
            let basePrice = sizeOption?.price || 79
            if (isCheesecakeWall) basePrice += 20 // Approx diff based on menu (79->99, 89->109)

            finalPrice = basePrice + (selectedAddOns.reduce((sum, a) => sum + a.price, 0))
            customName = `${selectedFlavor} ${item.title} (${selectedSize}, ${sugarLevel} sugar)${isCheesecakeWall ? ' + Cheesecake Wall' : ''}${addOnsText}`
        } else if (isFruitTea && selectedSize && selectedFlavor) {
            const sizeOption = fruitTeaOptions.sizes.find(s => s.label === selectedSize)
            finalPrice = (sizeOption?.price || 75) + (selectedAddOns.reduce((sum, a) => sum + a.price, 0))
            customName = `${selectedFlavor} ${item.title} (${selectedSize}, ${sugarLevel} sugar)${addOnsText}`
        }

        const customizedItem = {
            ...item,
            id: `${item.id}-${selectedSize || ''}-${selectedFlavor || ''}-${Date.now()}`,
            customTitle: customName.trim(),
            price: finalPrice,
            quantity: quantity
        }
        addToCart(customizedItem)
        setQuantity(1) // Reset quantity
        onClose()
    }

    const toggleAddOn = (addon) => {
        if (selectedAddOns.find(a => a.label === addon.label)) {
            setSelectedAddOns(selectedAddOns.filter(a => a.label !== addon.label))
        } else {
            setSelectedAddOns([...selectedAddOns, addon])
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--c-slate)', border: '1px solid var(--border-light)' }}>
                <button className="modal-close" onClick={onClose} style={{ color: 'var(--c-gold)' }}>&times;</button>

                <div className="modal-body" style={{ display: 'block', padding: 0 }}>
                    <div className="modal-details" style={{ color: 'white', padding: '2rem' }}>
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

                        {/* Buldak Customization */}
                        {isBuldak && (
                            <>
                                <div className="modal-section">
                                    <p className="modal-label">Select Variant</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {buldakOptions.flavors.map(f => (
                                            <button
                                                key={f}
                                                className={`category-btn ${selectedFlavor === f ? 'active' : ''}`}
                                                onClick={() => setSelectedFlavor(f)}
                                                style={{ fontSize: '0.9rem' }}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-section">
                                    <p className="modal-label">Add-ons (Optional)</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {buldakOptions.addOns.map(addon => (
                                            <button
                                                key={addon.label}
                                                className={`category-btn ${selectedAddOns.find(a => a.label === addon.label) ? 'active' : ''}`}
                                                onClick={() => toggleAddOn(addon)}
                                            >
                                                {addon.label} (+₱{addon.price})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Milktea Customization */}
                        {isMilktea && (
                            <>
                                <div className="modal-section">
                                    <p className="modal-label">Select Flavor</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {milkteaOptions.flavors.map(f => (
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
                                <div className="modal-section">
                                    <p className="modal-label">Select Size</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {milkteaOptions.sizes.map(s => (
                                            <button
                                                key={s.label}
                                                className={`category-btn ${selectedSize === s.label ? 'active' : ''}`}
                                                onClick={() => setSelectedSize(s.label)}
                                            >
                                                {s.label} (Starting ₱{s.price})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-section">
                                    <p className="modal-label">Sugar Level</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {milkteaOptions.sugar.map(l => (
                                            <button
                                                key={l}
                                                className={`category-btn ${sugarLevel === l ? 'active' : ''}`}
                                                onClick={() => setSugarLevel(l)}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-section">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px' }}>
                                        <input
                                            type="checkbox"
                                            checked={isCheesecakeWall}
                                            onChange={(e) => setIsCheesecakeWall(e.target.checked)}
                                            style={{ transform: 'scale(1.5)' }}
                                        />
                                        <span style={{ fontSize: '1rem' }}>Add Cheesecake Wall (+₱20)</span>
                                    </label>
                                </div>
                                <div className="modal-section">
                                    <p className="modal-label">Add-ons</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {milkteaOptions.addOns.map(addon => (
                                            <button
                                                key={addon.label}
                                                className={`category-btn ${selectedAddOns.find(a => a.label === addon.label) ? 'active' : ''}`}
                                                onClick={() => toggleAddOn(addon)}
                                            >
                                                {addon.label} (+₱{addon.price})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Fruit Tea Customization */}
                        {isFruitTea && (
                            <>
                                <div className="modal-section">
                                    <p className="modal-label">Select Flavor</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {fruitTeaOptions.flavors.map(f => (
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
                                <div className="modal-section">
                                    <p className="modal-label">Select Size</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {fruitTeaOptions.sizes.map(s => (
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
                                    <p className="modal-label">Sugar Level</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {milkteaOptions.sugar.map(l => (
                                            <button
                                                key={l}
                                                className={`category-btn ${sugarLevel === l ? 'active' : ''}`}
                                                onClick={() => setSugarLevel(l)}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-section">
                                    <p className="modal-label">Add-ons</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {fruitTeaOptions.addOns.map(addon => (
                                            <button
                                                key={addon.label}
                                                className={`category-btn ${selectedAddOns.find(a => a.label === addon.label) ? 'active' : ''}`}
                                                onClick={() => toggleAddOn(addon)}
                                            >
                                                {addon.label} (+₱{addon.price})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
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

                        <div className="modal-section">
                            <p className="modal-label">Quantity</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    style={{ background: 'var(--c-slate)', border: '1px solid var(--border-light)', color: 'white', width: '40px', height: '40px', borderRadius: '4px', fontSize: '1.2rem' }}
                                >-</button>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    style={{ background: 'var(--c-gold)', border: 'none', color: 'var(--c-midnight)', width: '40px', height: '40px', borderRadius: '4px', fontSize: '1.2rem', fontWeight: 'bold' }}
                                >+</button>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                            <button
                                className="btn-primary"
                                style={{ width: '100%' }}
                                onClick={handleAddToCart}
                                disabled={
                                    (isWings && (!selectedSize || !selectedFlavor)) ||
                                    (isPlatter && !selectedSize) ||
                                    (isRefreshers && !selectedFlavor) ||
                                    (isBuldak && !selectedFlavor) ||
                                    (isMilktea && (!selectedSize || !selectedFlavor)) ||
                                    (isFruitTea && (!selectedSize || !selectedFlavor))
                                }
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
