// Voice functionality test helper
export class VoiceTestHelper {
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private testResults: { [key: string]: boolean } = {};
  
  constructor() {
    this.testResults = {
      speechRecognitionSupport: false,
      microphoneAccess: false,
      audioContextSupport: false,
      webAudioAPI: false,
      speechSynthesis: false
    };
  }

  // Test browser support for voice features
  async testBrowserSupport(): Promise<{ [key: string]: boolean }> {
    console.log('🧪 Testing browser support for voice features...');
    
    // Test Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.testResults.speechRecognitionSupport = !!SpeechRecognition;
    console.log(`Speech Recognition: ${this.testResults.speechRecognitionSupport ? '✅' : '❌'}`);
    
    // Test Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.testResults.audioContextSupport = !!AudioContextClass;
    console.log(`Audio Context: ${this.testResults.audioContextSupport ? '✅' : '❌'}`);
    
    // Test Web Audio API
    this.testResults.webAudioAPI = !!(AudioContextClass && 'createAnalyser' in AudioContextClass.prototype);
    console.log(`Web Audio API: ${this.testResults.webAudioAPI ? '✅' : '❌'}`);
    
    // Test Speech Synthesis
    this.testResults.speechSynthesis = !!(window.speechSynthesis && 'speak' in window.speechSynthesis);
    console.log(`Speech Synthesis: ${this.testResults.speechSynthesis ? '✅' : '❌'}`);
    
    // Test microphone access
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.testResults.microphoneAccess = true;
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone Access: ✅');
      } else {
        console.log('Microphone Access: ❌ (getUserMedia not available)');
      }
    } catch (error) {
      console.log(`Microphone Access: ❌ (${(error as Error).message})`);
    }
    
    return this.testResults;
  }

  // Test speech recognition functionality
  async testSpeechRecognition(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🎤 Testing speech recognition...');
      
      if (!this.testResults.speechRecognitionSupport) {
        console.log('❌ Speech recognition not supported');
        resolve(false);
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      let timeout: NodeJS.Timeout;

      this.recognition.onstart = () => {
        console.log('✅ Speech recognition started successfully');
        // Stop after 1 second for testing
        timeout = setTimeout(() => {
          this.recognition.stop();
        }, 1000);
      };

      this.recognition.onend = () => {
        console.log('✅ Speech recognition ended successfully');
        clearTimeout(timeout);
        resolve(true);
      };

      this.recognition.onerror = (event: any) => {
        console.log(`❌ Speech recognition error: ${event.error}`);
        clearTimeout(timeout);
        resolve(false);
      };

      try {
        this.recognition.start();
      } catch (error) {
        console.log(`❌ Failed to start speech recognition: ${(error as Error).message}`);
        resolve(false);
      }
    });
  }

  // Test audio context and analysis
  async testAudioAnalysis(): Promise<boolean> {
    console.log('🎵 Testing audio analysis...');
    
    if (!this.testResults.audioContextSupport || !this.testResults.microphoneAccess) {
      console.log('❌ Audio analysis prerequisites not met');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      const analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // Test data retrieval
      analyser.getByteFrequencyData(dataArray);
      
      console.log('✅ Audio analysis working');
      
      // Cleanup
      stream.getTracks().forEach(track => track.stop());
      if (this.audioContext) {
        this.audioContext.close();
      }
      
      return true;
    } catch (error) {
      console.log(`❌ Audio analysis failed: ${(error as Error).message}`);
      return false;
    }
  }

  // Test text-to-speech
  async testTextToSpeech(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🔊 Testing text-to-speech...');
      
      if (!this.testResults.speechSynthesis) {
        console.log('❌ Speech synthesis not supported');
        resolve(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance('Test');
      utterance.volume = 0; // Silent test
      utterance.rate = 10; // Fast to finish quickly
      
      utterance.onstart = () => {
        console.log('✅ Text-to-speech started successfully');
      };
      
      utterance.onend = () => {
        console.log('✅ Text-to-speech completed successfully');
        resolve(true);
      };
      
      utterance.onerror = (event) => {
        console.log(`❌ Text-to-speech error: ${event.error}`);
        resolve(false);
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        speechSynthesis.cancel();
        console.log('⏰ Text-to-speech test timed out');
        resolve(false);
      }, 5000);

      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.log(`❌ Failed to start text-to-speech: ${(error as Error).message}`);
        resolve(false);
      }
    });
  }

  // Run comprehensive voice functionality test
  async runComprehensiveTest(): Promise<{
    overall: boolean;
    details: { [key: string]: boolean };
    recommendations: string[];
  }> {
    console.log('🚀 Starting comprehensive voice functionality test...');
    
    const support = await this.testBrowserSupport();
    const speechRecTest = await this.testSpeechRecognition();
    const audioAnalysisTest = await this.testAudioAnalysis();
    const ttsTest = await this.testTextToSpeech();
    
    const allTests = {
      ...support,
      speechRecognitionFunctional: speechRecTest,
      audioAnalysisFunctional: audioAnalysisTest,
      textToSpeechFunctional: ttsTest
    };
    
    const criticalTests = [
      'speechRecognitionSupport',
      'microphoneAccess',
      'audioContextSupport',
      'speechRecognitionFunctional'
    ];
    
    const overall = criticalTests.every(test => allTests[test]);
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (!support.speechRecognitionSupport) {
      recommendations.push('Use a modern browser that supports Speech Recognition API (Chrome, Edge, Safari)');
    }
    
    if (!support.microphoneAccess) {
      recommendations.push('Grant microphone permission and ensure a microphone is connected');
    }
    
    if (!support.audioContextSupport) {
      recommendations.push('Update your browser to support Web Audio API');
    }
    
    if (!speechRecTest) {
      recommendations.push('Check microphone permissions and try reloading the page');
    }
    
    if (!audioAnalysisTest) {
      recommendations.push('Ensure microphone is working and not being used by other applications');
    }
    
    if (!ttsTest) {
      recommendations.push('Check browser audio settings and ensure speakers/headphones are working');
    }
    
    if (overall) {
      recommendations.push('🎉 All voice functionality tests passed! Your system is ready for AI Voice Mode.');
    }
    
    console.log('📊 Test Results Summary:');
    Object.entries(allTests).forEach(([test, result]) => {
      console.log(`  ${test}: ${result ? '✅' : '❌'}`);
    });
    
    console.log('📝 Recommendations:');
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    return {
      overall,
      details: allTests,
      recommendations
    };
  }
  
  // Quick diagnostic for troubleshooting
  async quickDiagnostic(): Promise<string> {
    const support = await this.testBrowserSupport();
    
    if (!support.speechRecognitionSupport) {
      return 'Browser does not support Speech Recognition. Please use Chrome, Edge, or Safari.';
    }
    
    if (!support.microphoneAccess) {
      return 'Microphone access denied or unavailable. Please grant permission and ensure microphone is connected.';
    }
    
    if (!support.audioContextSupport) {
      return 'Browser does not support Web Audio API. Please update your browser.';
    }
    
    return 'Basic voice functionality should work. If you experience issues, try refreshing the page.';
  }
} 