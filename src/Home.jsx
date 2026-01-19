import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import logo from './assets/gabzab_logo.jpg'
import heroImg from './assets/hero.jpg'
import FullDetailsModal from './FullDetailsModal'
import Maintenance from './Maintenance'

const IS_PAUSED = false;

const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
};

function Home() {
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cart, setCart] = useState([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [filter, setFilter] = useState('All')
    const [checkoutStep, setCheckoutStep] = useState('cart') // cart, shipping, success
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [orderType, setOrderType] = useState('delivery')
    const [paymentMethod, setPaymentMethod] = useState('cod')
    const [lastOrder, setLastOrder] = useState(null)
    const [showToast, setShowToast] = useState(false)

    // Admin Settings States
    const [categories, setCategories] = useState([])
    const [orderTypes, setOrderTypes] = useState([])
    const [paymentSettings, setPaymentSettings] = useState([])
    const [storeSettings, setStoreSettings] = useState({
        store_name: 'Gabzab Food House',
        contact: '0939-594-7269',
        open_time: '10:00',
        close_time: '21:00',
        address: 'Philippines'
    })

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('gabzab_cart')
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart))
            } catch (e) {
                console.error('Error parsing cart from local storage', e)
            }
        }
    }, [])

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('gabzab_cart', JSON.stringify(cart))
    }, [cart])

    useEffect(() => {
        fetchAllSettings()
        fetchMenuItems()
    }, [])

    const fetchAllSettings = async () => {
        try {
            // Fetch Categories
            const { data: catData } = await supabase.from('categories').select('*').order('sort_order', { ascending: true })
            if (catData) setCategories(catData)

            // Fetch Order Types
            const { data: otData } = await supabase.from('order_types').select('*').eq('is_active', true)
            if (otData) {
                setOrderTypes(otData)
                if (otData.length > 0 && !otData.find(ot => ot.id === orderType)) {
                    setOrderType(otData[0].id)
                }
            }

            // Fetch Payment Settings
            const { data: psData } = await supabase.from('payment_settings').select('*').eq('is_active', true)
            if (psData) {
                setPaymentSettings(psData)
                if (psData.length > 0 && !psData.find(ps => ps.id === paymentMethod)) {
                    setPaymentMethod(psData[0].id)
                }
            }

            // Fetch Store Settings
            const { data: ssData } = await supabase.from('store_settings').select('*').single()
            if (ssData) setStoreSettings(ssData)
        } catch (err) {
            console.error('Error fetching settings:', err.message)
        }
    }

    if (IS_PAUSED) {
        return <Maintenance />
    }

    const handleMessengerRedirect = (e) => {
        if (e) e.preventDefault();

        // Use window.location.href instead of window.open to avoid "double page" (extra tabs) on iOS
        window.location.href = "https://m.me/gzsbaratong.baligya.79";
    };

    const fetchMenuItems = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setMenuItems(data || [])
        } catch (err) {
            console.error('Error fetching menu items:', err.message)
            setError('Failed to load menu. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    const addToCart = (item) => {
        const quantityToAdd = item.quantity || 1
        const existingItem = cart.find(cartItem => cartItem.id === item.id)
        if (existingItem) {
            setCart(cart.map(cartItem =>
                cartItem.id === item.id
                    ? { ...cartItem, quantity: (cartItem.quantity || 1) + quantityToAdd }
                    : cartItem
            ))
        } else {
            setCart([...cart, { ...item, quantity: quantityToAdd }])
        }
        // Show success feedback
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
    }

    const updateQuantity = (id, change) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQuantity = (item.quantity || 1) + change
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
            }
            return item
        }))
    }

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id))
    }


    const handleCheckout = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)

        // Construct customer details object
        const customerDetails = {
            full_name: formData.get('fullName'),
            email: 'guest@gabzabfoodhouse.com',
            phone: formData.get('phone'),
            address: (orderType === 'delivery' || orderType === 'pickup')
                ? `${formData.get('address') || 'N/A'} ${formData.get('location') ? `(Landmark: ${formData.get('location')})` : ''}`
                : 'Dine In',
            table_number: orderType === 'dine-in' ? formData.get('tableNumber') : null
        }

        const orderData = {
            order_type: orderType,
            payment_method: paymentMethod,
            total_amount: cartTotal,
            items: cart,
            status: 'Pending',
            customer_details: customerDetails
        }

        // Plain text summary for clipboard (No emojis, no special symbols)
        const summary = `HELLO GABZAB FOOD HOUSE\n` +
            `ORDER REF: #${Date.now().toString().slice(-6)}\n` +
            `------------------\n` +
            `CUSTOMER: ${customerDetails.full_name}\n` +
            `PHONE: ${customerDetails.phone}\n` +
            `TYPE: ${orderData.order_type.toUpperCase()}\n` +
            ((orderData.order_type === 'delivery' || orderData.order_type === 'pickup') ? `ADDRESS: ${customerDetails.address}\n` : `TABLE: ${customerDetails.table_number}\n`) +
            `PAYMENT: ${orderData.payment_method.toUpperCase()}\n` +
            `------------------\n` +
            `ITEMS:\n${orderData.items.map(i => `* ${i.quantity || 1}x ${i.customTitle || i.name}`).join('\n')}\n` +
            `------------------\n` +
            `TOTAL: PHP ${orderData.total_amount.toLocaleString()}`;

        try {
            setIsSubmitting(true)
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single()

            if (error) throw error

            setLastOrder({ ...data, summary: summary + `\nRef: #${data.id}\nTime: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}` })
            setCheckoutStep('success')
            setCart([])
            localStorage.removeItem('gabzab_cart')

            // Removed auto-copy to comply with manual flow requirement
        } catch (err) {
            alert('Error processing order: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredItems = menuItems.filter(p => {
        const matchesCategory = filter === 'All' || p.category_id === filter || p.category === filter
        return matchesCategory
    })

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

    return (
        <div className="home">
            {/* Toast Notification */}
            {showToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    zIndex: 3000,
                    animation: 'fadeIn 0.3s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <span style={{ color: '#4ade80' }}>✓</span> Added to Cart
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .checkout-form label {
                    color: black !important;
                    font-weight: 600;
                }
                .checkout-form input, 
                .checkout-form select, 
                .checkout-form textarea {
                    color: black !important;
                    background: rgba(255, 255, 255, 0.8) !important;
                }
                .checkout-form input::placeholder, 
                .checkout-form textarea::placeholder {
                    color: #666 !important;
                }
            `}</style>
            {/* Top Banner */}
            <div className="top-banner">
                {storeSettings.store_name} - American Ribhouse | {storeSettings.address} | Tel: {storeSettings.contact} | Hours: {formatTime12h(storeSettings.open_time)} - {formatTime12h(storeSettings.close_time)}
            </div>

            {/* Navbar */}
            <nav className="navbar">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={logo} alt="Gabzab Food House Logo" style={{ height: '55px', width: '55px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--accent)' }} />
                        <span className="brand-name" style={{
                            color: 'var(--c-gold)',
                            fontSize: '1.4rem',
                            fontWeight: '800',
                            fontFamily: 'Alfa Slab One, serif',
                            letterSpacing: '1px',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                        }}>{storeSettings.store_name}</span>
                    </div>
                    <button className="cart-icon" onClick={() => { setIsCartOpen(true); setCheckoutStep('cart') }}>
                        <span style={{ fontSize: '1.2rem' }}>🛒</span> <span className="cart-count">{cart.length}</span>
                    </button>
                </div>
            </nav>
            <div className="sub-header" style={{ position: 'sticky', top: '90px', zIndex: 999, backgroundColor: 'var(--glass-midnight)', padding: '1rem 0', borderBottom: '1px solid var(--border-light)', backdropFilter: 'blur(10px)' }}>
                {/* Categories Slider */}
                <div className="container" style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: '0.8rem',
                    whiteSpace: 'nowrap',
                    paddingBottom: '5px',
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none'  /* IE 10+ */
                }}>
                    {/* Hide scrollbar for Chrome/Safari/Opera */}
                    <style>{`
                        .container::-webkit-scrollbar { 
                            display: none; 
                        }
                    `}</style>
                    <button
                        onClick={() => {
                            setFilter('All');
                            document.getElementById('menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className={`category-btn ${filter === 'All' ? 'active' : ''}`}
                        style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', flexShrink: 0 }}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setFilter(cat.id);
                                document.getElementById('menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`category-btn ${filter === cat.id ? 'active' : ''}`}
                            style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', flexShrink: 0 }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>


            {/* Menu Section */}
            <section className="gallery-section" id="menu">
                <div className="container">
                    <div className="section-title" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 className="logo-branding" style={{ fontSize: '3.5rem', marginBottom: '1rem', display: 'block' }}>Our Menu</h2>
                        <p style={{ fontFamily: 'Alfa Slab One, serif', fontSize: '1.2rem', color: 'var(--c-gold)', letterSpacing: '1px', textShadow: '2px 2px 0px #000' }}>
                            CRAVE FULFILLED, RIGHT AT YOUR DOORSTEP!
                        </p>
                        <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginTop: '0.8rem', fontWeight: '500' }}>
                            Book your orders now and satisfy your cravings!
                        </p>
                    </div>


                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '5rem' }}>
                            <div className="loader">Preparing Delicious Food...</div>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--c-gold)' }}>
                            <p>{error}</p>
                            <button onClick={fetchMenuItems} style={{ marginTop: '1rem', textDecoration: 'underline' }}>Try Again</button>
                        </div>
                    ) : (
                        <>
                            <div className="gallery-grid">
                                {filteredItems.map(item => (
                                    <div key={item.id} className="painting-card">
                                        <div className="painting-image-container">
                                            <img
                                                src={item.image || logo}
                                                alt={item.title}
                                                className="painting-image"
                                                onError={(e) => { e.target.onerror = null; e.target.src = logo; }}
                                            />
                                        </div>
                                        <div className="painting-info">
                                            <h3 className="painting-title">{item.name}</h3>
                                            <p className="item-description-short">{item.description || 'Deliciously prepared with our signature recipe.'}</p>
                                            <p className="painting-price">₱{Number(item.price).toLocaleString()}</p>
                                            <button
                                                className="btn-view-details"
                                                onClick={() => {
                                                    setSelectedItem(item)
                                                    setIsModalOpen(true)
                                                }}
                                                style={{ marginTop: '1rem', background: 'var(--c-gold)', color: 'var(--c-midnight)', fontWeight: '700', border: 'none' }}
                                            >
                                                Customize
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '2rem 0', backgroundColor: '#0a0a0c', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                </div>
            </footer>

            {/* Cart Panel Shell */}
            <div className={`cart-panel ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h3>{checkoutStep === 'cart' ? 'Your Order' : checkoutStep === 'success' ? 'Final Step' : 'Order Details'}</h3>
                    <button onClick={() => setIsCartOpen(false)} style={{ fontSize: '1.5rem' }}>&times;</button>
                </div>

                {checkoutStep === 'cart' && (
                    <>
                        <div className="cart-items">
                            {cart.length === 0 ? (
                                <p style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-light)' }}>Your order list is empty.</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <img src={item.image} alt={item.title} className="cart-item-img" />
                                        <div className="cart-item-details">
                                            <h4>{item.customTitle || item.name}</h4>
                                            <p>₱{Number(item.price).toLocaleString()}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem', borderRadius: '4px' }}>
                                                    <button onClick={() => updateQuantity(item.id, -1)} style={{ color: 'white', fontSize: '1rem', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                                    <span style={{ fontWeight: 'bold' }}>{item.quantity || 1}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} style={{ color: 'white', fontSize: '1rem', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--c-gold)', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="cart-footer">
                                <div className="cart-total">
                                    <span>Total</span>
                                    <span>₱{cartTotal.toLocaleString()}</span>
                                </div>
                                <button className="btn-primary" style={{ width: '100%' }} onClick={() => setCheckoutStep('shipping')}>Proceed to Checkout</button>
                            </div>
                        )}
                    </>
                )}

                {checkoutStep === 'shipping' && (
                    <div className="cart-items">
                        <form className="checkout-form" onSubmit={handleCheckout}>
                            <div className="form-group">
                                <label>Order Type</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {orderTypes.map(ot => (
                                        <button
                                            key={ot.id}
                                            type="button"
                                            className={`category-btn ${orderType === ot.id ? 'active' : ''}`}
                                            onClick={() => setOrderType(ot.id)}
                                            style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', minWidth: '80px' }}
                                        >
                                            {ot.name}
                                        </button>
                                    ))}
                                </div>
                                <input type="hidden" name="orderType" value={orderType} />
                            </div>

                            <div className="form-group">
                                <label>Full Name</label>
                                <input name="fullName" type="text" required placeholder="Your Name" />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input name="phone" type="tel" required placeholder="e.g. 09123456789" />
                            </div>


                            {(orderType === 'delivery' || orderType === 'pickup') ? (
                                <>
                                    <div className="form-group">
                                        <label>{orderType === 'delivery' ? 'Delivery Address' : 'Pickup Instructions'}</label>
                                        <textarea
                                            name="address"
                                            required
                                            placeholder={orderType === 'delivery' ? "House No., Street, Brgy., City" : "Note for pickup (e.g. Pickup at 6PM)"}
                                            rows="3"
                                        ></textarea>
                                    </div>
                                    {orderType === 'delivery' && (
                                        <div className="form-group">
                                            <label>Location / Landmark</label>
                                            <input name="location" type="text" placeholder="e.g. Blue Gate, Near Chapel, etc." />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="form-group">
                                    <label>Table Number</label>
                                    <input name="tableNumber" type="text" required placeholder="e.g. Table 5" />
                                </div>
                            )}

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>Payment Method</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    {paymentSettings.map(pm => (
                                        <button
                                            key={pm.id}
                                            type="button"
                                            className={`category-btn ${paymentMethod === pm.id ? 'active' : ''}`}
                                            onClick={() => setPaymentMethod(pm.id)}
                                            style={{ flex: '1 1 auto', minWidth: '100px' }}
                                        >
                                            {pm.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {paymentSettings.find(pm => pm.id === paymentMethod)?.qr_url && (
                                <div style={{ textAlign: 'center', marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--c-gold)', marginBottom: '1rem' }}>Scan QR and Send Screenshot to Messenger</p>
                                    <img src={paymentSettings.find(pm => pm.id === paymentMethod).qr_url} alt={`${paymentMethod} QR Code`} style={{ width: '100%', maxWidth: '200px', borderRadius: '10px' }} />
                                </div>
                            )}
                            {paymentSettings.find(pm => pm.id === paymentMethod)?.account_number && (
                                <div style={{ textAlign: 'center', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.9rem', color: 'white' }}>{paymentSettings.find(pm => pm.id === paymentMethod).account_name}</p>
                                    <p style={{ fontSize: '1.1rem', color: 'var(--c-gold)', fontWeight: 'bold' }}>{paymentSettings.find(pm => pm.id === paymentMethod).account_number}</p>
                                </div>
                            )}

                            <div className="cart-total" style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                                <span>Total Amount</span>
                                <span>PHP {cartTotal.toLocaleString()}</span>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', marginTop: '1rem', background: '#0084FF' }}>
                                {isSubmitting ? 'Processing...' : 'Submit & Message Us'}
                            </button>
                            <p style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-light)' }}>
                                Clicking "Submit" will save your order and prepare it for Messenger.
                            </p>
                            <button type="button" onClick={() => setCheckoutStep('cart')} style={{ width: '100%', marginTop: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', textDecoration: 'underline' }}>
                                Back to Cart
                            </button>
                        </form>
                    </div>
                )}

                {checkoutStep === 'success' && (
                    <div className="cart-items" style={{ textAlign: 'center', paddingTop: '1rem' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--c-gold)', marginBottom: '1rem' }}>Order Placed</div>
                        <h2 style={{ fontSize: '1.8rem' }}>Direct Order via Messenger</h2>
                        <p style={{ color: 'var(--text-light)', marginTop: '0.5rem', fontSize: '0.95rem', fontWeight: '500' }}>
                            All order details are sent directly to our Messenger to process your order immediately.
                        </p>

                        {lastOrder && (
                            <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'left', border: '2px solid #0084FF' }}>
                                <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: 'var(--c-gold)', marginBottom: '0.5rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Verify & Send</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#fff' }}>Please follow these steps to complete your order:</p>
                                </div>

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <button
                                        className="btn-secondary"
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            try {
                                                await navigator.clipboard.writeText(lastOrder.summary);
                                                btn.innerText = "✅ Copied to Clipboard!";
                                                setTimeout(() => btn.innerText = "1. Copy Order Details", 2000);
                                            } catch (err) {
                                                const textArea = document.createElement("textarea");
                                                textArea.value = lastOrder.summary;
                                                document.body.appendChild(textArea);
                                                textArea.select();
                                                document.execCommand('copy');
                                                document.body.removeChild(textArea);
                                                btn.innerText = "✅ Copied to Clipboard!";
                                                setTimeout(() => btn.innerText = "1. Copy Order Details", 2000);
                                            }
                                        }}
                                        style={{ width: '100%', padding: '1rem', fontWeight: 'bold', background: '#d32f2f', color: 'white', border: 'none' }}
                                    >
                                        1. Copy Order Details
                                    </button>

                                    <a
                                        href="https://m.me/gzsbaratong.baligya.79"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary"
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            background: '#0084FF',
                                            color: 'white',
                                            border: 'none',
                                            fontWeight: 'bold',
                                            textDecoration: 'none',
                                            display: 'block',
                                            textAlign: 'center',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        2. Open Messenger & Paste
                                    </a>
                                </div>

                                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}><b>Order Preview:</b></p>
                                    <pre style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '4px', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', fontFamily: 'monospace' }}>
                                        {lastOrder.summary}
                                    </pre>
                                </div>
                            </div>
                        )}

                        <button
                            className="btn-secondary"
                            style={{ marginTop: '1.5rem', width: '100%', border: 'none' }}
                            onClick={() => { setIsCartOpen(false); setLastOrder(null); setCheckoutStep('cart'); }}
                        >
                            Return to Menu
                        </button>
                    </div>
                )}
            </div>

            {/* Overlay for Cart */}
            {
                isCartOpen && (
                    <div
                        onClick={() => setIsCartOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 1999,
                        }}
                    ></div>
                )
            }

            {/* Full Details Modal */}
            <FullDetailsModal
                painting={selectedItem}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                addToCart={addToCart}
            />
        </div >
    )
}

export default Home
