"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getTemplate } from "@/lib/registry";
import { FaImage } from "react-icons/fa";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { standaloneConfig } from "@/lib/standaloneConfig";

export default function StandaloneWorkspace() {
  const { data: session } = useSession();
  const [activeCreation, setActiveCreation] = useState(null);
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const fetchingRef = useRef(false);
  const pollingActiveRef = useRef(false);

  const pollCreationStatus = async (creationId) => {
    if (pollingActiveRef.current) return;
    pollingActiveRef.current = true;
    try {
      const { data: userCreations } = await axios.get(`/api/creations?appId=${standaloneConfig.appId}`);
      setCreations(userCreations || []);

      const current = userCreations.find(c => c.id === creationId);
      if (!current) {
        setGenerating(false);
        pollingActiveRef.current = false;
        return;
      }

      if (current.status === "completed" || current.status === "failed") {
        setActiveCreation(current);
        setGenerating(false);
        pollingActiveRef.current = false;
      } else {
        pollingActiveRef.current = false;
        setTimeout(() => pollCreationStatus(creationId), 3000);
      }
    } catch (err) {
      console.error("Polling error:", err);
      setGenerating(false);
      pollingActiveRef.current = false;
    }
  };

  const handleCreationCompleted = (data) => {
    if (!data) {
      fetchAppData();
      return;
    }

    if (data.status === "completed" || data.status === "failed") {
      setActiveCreation(data);
      setGenerating(false);
      fetchAppData(); // Sync creations list
    } else if (data.status === "processing") {
      setActiveCreation(data);
      setGenerating(true);
      pollCreationStatus(data.id);
    }
  };

  const fetchAppData = async (immediateActiveCreation = null) => {
    if (fetchingRef.current && !immediateActiveCreation) return;
    fetchingRef.current = true;
    try {
      const { data: userCreations } = await axios.get(`/api/creations?appId=${standaloneConfig.appId}`);
      setCreations(userCreations || []);

      setActiveCreation((prevActive) => {
        if (immediateActiveCreation) {
          return userCreations.find(c => c.id === immediateActiveCreation.id) || immediateActiveCreation;
        }
        if (userCreations && userCreations.length > 0) {
          const processing = userCreations.find(c => c.status === "processing");
          if (processing) {
            setGenerating(true);
            pollCreationStatus(processing.id);
            return processing;
          }
          if (prevActive) {
            const updated = userCreations.find(c => c.id === prevActive.id);
            if (updated) return updated;
          }
        }
        return null;
      });
    } catch (err) {
      console.error("Error loading creations:", err);
      toast.error("Failed to load workspace data.");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col bg-bg-page select-none text-primary-text">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  // Mimic the AppInstance structure expected by components
  const appInstance = {
    id: standaloneConfig.appId,
    name: standaloneConfig.name,
    templateId: standaloneConfig.templateId,
    config: JSON.stringify(standaloneConfig.config)
  };

  const template = getTemplate(standaloneConfig.templateId);
  const TemplateComponent = template ? template.component : null;

  return (
    <div className="min-h-dvh flex flex-col bg-bg-page select-none text-primary-text overflow-hidden">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 gap-6 overflow-y-auto scrollbar-subtle">
        <div className="flex items-center justify-between border-b border-divider/40 pb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-black uppercase tracking-tight text-white">{standaloneConfig.name}</h1>
            <p className="text-xs text-secondary-text">Configure prompts and generate outputs live in your dedicated workspace.</p>
          </div>
          <span className="text-[10px] uppercase font-black px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary tracking-widest shrink-0">
            {template ? template.name : "Custom App"}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center p-2">
          {TemplateComponent ? (
            <TemplateComponent
              appInstance={appInstance}
              activeCreation={activeCreation}
              generating={generating}
              setGenerating={setGenerating}
              onCreationCompleted={handleCreationCompleted}
            />
          ) : (
            <div className="text-xs text-red-500 font-bold">
              Invalid template component.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
