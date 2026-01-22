import React, { useState, useEffect } from 'react'

export default function FullDetailsModal(props) {
    const { painting: item, isOpen, onClose, addToCart } = props

    const [selectedVariation, setSelectedVariation] = useState(null)
    const [selectedFlavor, setSelectedFlavor] = useState('')
    const [selectedAddOns, setSelectedAddOns] = useState([])
    const [diningPreference, setDiningPreference] = useState('')
    const [quantity, setQuantity] = useState(1)

    // Reset state when modal opens with a new item
    useEffect(() => {
        if (isOpen && item) {
            setSelectedVariation(null)
            setSelectedFlavor('')
            setSelectedAddOns([])
            setDiningPreference('')
            setQuantity(1)
        }
    }, [isOpen, item])

    if (!isOpen || !item) return null

    // Helper to get array from JSONB or fallback to empty array
    const variations = Array.isArray(item.variations) ? item.variations : []
    const flavors = Array.isArray(item.flavors) ? item.flavors : []
    const addons = Array.isArray(item.addons) ? item.addons : []

    // Dining Options (Mandatory & Free)
    // Use passed props or fallback to system defaults
    const diningOptions = Array.isArray(props.diningOptions) && props.diningOptions.length > 0
        ? props.diningOptions
        : [
            { label: 'Regular Preparation', value: 'regular' },
            { label: 'Less Waste (No Utensils)', value: 'no_utensils' },
            { label: 'Gift Packaging', value: 'gift' }
        ]

    const handleAddToCart = () => {
        let finalPrice = Number(item.price)
        let customName = item.name || ''
        let optionsSummary = []

        // Handle Variation price & name
        if (selectedVariation) {
            finalPrice = Number(selectedVariation.price) || finalPrice
            optionsSummary.push(selectedVariation.name)
        }

        // Handle Flavor
        if (selectedFlavor) {
            optionsSummary.push(selectedFlavor)
        }

        // Handle Add-ons
        if (selectedAddOns.length > 0) {
            const addOnsTotal = selectedAddOns.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0)
            finalPrice += addOnsTotal
            optionsSummary.push(`+ ${selectedAddOns.map(a => a.name).join(', ')}`)
        }

        // Handle Dining Preference
        const pref = diningOptions.find(o => (o.value === diningPreference || o.label === diningPreference))
        if (pref) {
            optionsSummary.push(`(${pref.label})`)
        }

        const customTitle = optionsSummary.length > 0
            ? `${item.name} [${optionsSummary.join(' | ')}]`
            : item.name

        const customizedItem = {
            ...item,
            id: `${item.id}-${selectedVariation?.name || 'std'}-${selectedFlavor || 'std'}-${(selectedAddOns.map(a => a.name).sort().join('_') || 'none')}-${diningPreference}`,
            customTitle: customTitle.trim(),
            price: finalPrice,
            quantity: quantity,
            customization: {
                variation: selectedVariation,
                flavor: selectedFlavor,
                addons: selectedAddOns,
                preference: diningPreference
            }
        }

        addToCart(customizedItem)
        onClose()
    }

    const toggleAddOn = (addon) => {
        if (selectedAddOns.find(a => a.name === addon.name)) {
            setSelectedAddOns(selectedAddOns.filter(a => a.name !== addon.name))
        } else {
            setSelectedAddOns([...selectedAddOns, addon])
        }
    }

    const isAddDisabled = () => {
        // Required: Variations (if exist)
        if (variations.length > 0 && !selectedVariation) return true
        // Required: Flavors (if exist)
        if (flavors.length > 0 && !selectedFlavor) return true
        // Required: Mandatory Free Option
        if (!diningPreference) return true
        return false
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--c-slate)', border: '1px solid var(--border-light)', maxWidth: '500px' }}>
                <button className="modal-close" onClick={onClose} style={{ color: 'var(--c-gold)' }}>&times;</button>

                <div className="modal-body" style={{ display: 'block', padding: 0 }}>
                    <div className="modal-details" style={{ color: 'var(--text)', padding: '2rem' }}>
                        <h2 className="logo-branding" style={{ color: 'var(--c-gold)', fontSize: '2rem', marginBottom: '0.5rem' }}>{item.name}</h2>
                        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{item.description}</p>

                        {/* Variations Section */}
                        {variations.length > 0 && (
                            <div className="modal-section" style={{ marginBottom: '1.5rem' }}>
                                <p className="modal-label" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Select Option</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--c-gold)' }}>REQUIRED</span>
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {variations.map(v => (
                                        <button
                                            key={v.name}
                                            className={`category-btn ${selectedVariation?.name === v.name ? 'active' : ''}`}
                                            onClick={() => setSelectedVariation(v)}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            {v.name} (₱{Number(v.price).toLocaleString()})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Flavors Section */}
                        {flavors.length > 0 && (
                            <div className="modal-section" style={{ marginBottom: '1.5rem' }}>
                                <p className="modal-label" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Select Flavor</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--c-gold)' }}>REQUIRED</span>
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {flavors.map(f => (
                                        <button
                                            key={typeof f === 'string' ? f : f.name}
                                            className={`category-btn ${selectedFlavor === (typeof f === 'string' ? f : f.name) ? 'active' : ''}`}
                                            onClick={() => setSelectedFlavor(typeof f === 'string' ? f : f.name)}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            {typeof f === 'string' ? f : f.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mandatory Free Option Section */}
                        <div className="modal-section" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255, 0, 0, 0.05)', borderRadius: '8px', border: '1px dashed var(--c-gold)' }}>
                            <p className="modal-label" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Dining Preference</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--c-gold)' }}>FREE & REQUIRED</span>
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {diningOptions.map((opt, idx) => (
                                    <button
                                        key={opt.value || idx}
                                        className={`category-btn ${diningPreference === (opt.value || opt.label) ? 'active' : ''}`}
                                        onClick={() => setDiningPreference(opt.value || opt.label)}
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Add-ons Section */}
                        {addons.length > 0 && (
                            <div className="modal-section" style={{ marginBottom: '1.5rem' }}>
                                <p className="modal-label" style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Add-ons (Optional)</p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {addons.map(addon => (
                                        <button
                                            key={addon.name}
                                            className={`category-btn ${selectedAddOns.find(a => a.name === addon.name) ? 'active' : ''}`}
                                            onClick={() => toggleAddOn(addon)}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            {addon.name} (+₱{Number(addon.price).toLocaleString()})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price Display */}
                        <div className="modal-section" style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p className="modal-label" style={{ marginBottom: '0.2rem' }}>Total Price</p>
                                    <p style={{ color: 'var(--c-gold)', fontSize: '1.8rem', fontWeight: '800' }}>
                                        ₱{((selectedVariation ? Number(selectedVariation.price) : Number(item.price)) + selectedAddOns.reduce((sum, a) => sum + (Number(a.price) || 0), 0)).toLocaleString()}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        style={{ background: 'white', border: '1px solid var(--border-light)', color: 'var(--text)', width: '35px', height: '35px', borderRadius: '4px', fontSize: '1rem' }}
                                    >-</button>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        style={{ background: 'var(--c-gold)', border: 'none', color: 'var(--c-midnight)', width: '35px', height: '35px', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold' }}
                                    >+</button>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', opacity: isAddDisabled() ? 0.6 : 1, cursor: isAddDisabled() ? 'not-allowed' : 'pointer' }}
                            onClick={handleAddToCart}
                            disabled={isAddDisabled()}
                        >
                            {isAddDisabled() ? 'Complete Selection' : 'Add to Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
