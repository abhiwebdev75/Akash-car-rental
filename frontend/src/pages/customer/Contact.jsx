import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { mockLocations } from '../../api/mockData';

export default function Contact() {
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    toast.success('Your message has been received! Our support desk will call you back.');
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600">24/7 Support Desk</span>
          <h1 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
            We're Here Whenever You Need Us
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Have questions about fleet availability, custom wedding or airport bookings, or highway roadside assistance? Get in touch with our operations team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hub Locations & Helplines (1 Col) */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Our Fleet Hubs</h3>
            {mockLocations.map((loc) => (
              <div key={loc._id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                  <h4 className="font-bold text-slate-900 text-sm">{loc.name}</h4>
                </div>
                <p className="text-slate-500">{loc.address}, {loc.city}, {loc.pincode}</p>
                <div className="pt-2 flex items-center gap-2 text-slate-700 font-bold">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${loc.phone}`} className="hover:text-brand-600">{loc.phone}</a>
                </div>
              </div>
            ))}

            <div className="p-5 rounded-3xl bg-brand-900 text-white shadow-md space-y-2 text-xs">
              <div className="flex items-center gap-2 text-accent-400 font-bold">
                <Clock className="w-4 h-4" />
                <span>24x7 Roadside Recovery Helpline</span>
              </div>
              <p className="text-slate-300">
                On-call breakdown recovery and replacement vehicle assistance across Punjab, Chandigarh & Himachal:
              </p>
              <p className="font-mono text-base font-black text-white">+91 98200 10000</p>
            </div>
          </div>

          {/* Contact Form (2 Cols) */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Send Us a Direct Message</h3>
              <p className="text-xs text-slate-500 mb-6">
                Expect an email or phone response within 15 minutes during operating hours.
              </p>

              {sent ? (
                <div className="p-8 rounded-2xl bg-emerald-50 text-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                  <h4 className="font-bold text-base">Message Sent Successfully!</h4>
                  <p className="text-xs">We will contact you at {email} shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 uppercase block mb-1">Your Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 font-semibold text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 uppercase block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 font-semibold text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Message</label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you need help with..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-brand-600/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

